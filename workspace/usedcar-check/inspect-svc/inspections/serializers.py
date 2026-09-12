from datetime import datetime

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import transaction
from rest_framework import serializers

from .models import InspectionItem, Report, ReportItem, ReportItemPhoto
from .scoring import RATING_CHOICES


class InspectionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InspectionItem
        fields = ("id", "code", "name", "category", "weight", "sort_order")


class ReportItemPhotoSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ReportItemPhoto
        fields = ("id", "url", "caption", "uploaded_at")

    def get_url(self, obj):
        if not obj.image:
            return None
        url = obj.image.url
        request = self.context.get("request")
        # 经前端 nginx 同源代理，返回相对路径即可
        return url if request is None else url


class ReportItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False, read_only=False)
    item = serializers.PrimaryKeyRelatedField(queryset=InspectionItem.objects.all())
    photos = ReportItemPhotoSerializer(many=True, required=False)

    class Meta:
        model = ReportItem
        fields = ("id", "item", "rating", "description", "photos")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # 读取时展开检测项目录（名称/分组/权重），写入仍接受 item 主键
        data["item"] = InspectionItemSerializer(instance.item).data
        return data

    def validate_rating(self, value):
        if value and value not in RATING_CHOICES:
            raise serializers.ValidationError("评级只能是 优/良/中/差")
        return value

    def validate_description(self, value):
        return value or ""


class ReportSerializer(serializers.ModelSerializer):
    items = ReportItemSerializer(many=True)

    class Meta:
        model = Report
        fields = (
            "id",
            "brand",
            "model",
            "year",
            "mileage",
            "inspector",
            "overall_score",
            "created_at",
            "updated_at",
            "items",
        )
        read_only_fields = ("overall_score", "created_at", "updated_at")
        extra_kwargs = {
            "year": {
                "validators": [
                    MinValueValidator(1950),
                    MaxValueValidator(datetime.now().year + 1),
                ]
            },
            "mileage": {"validators": [MinValueValidator(0)]},
        }

    def validate_items(self, value):
        item_ids = [entry["item"].id for entry in value]
        if len(item_ids) != len(set(item_ids)):
            raise serializers.ValidationError("同一检测项不能重复提交")
        return value

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        report = Report.objects.create(**validated_data)
        ReportItem.objects.bulk_create(
            [
                ReportItem(
                    report=report,
                    item=entry["item"],
                    rating=entry.get("rating", ""),
                    description=entry.get("description", ""),
                )
                for entry in items_data
            ]
        )
        report.recalculate_score()
        report.save(update_fields=["overall_score"])
        return report

    @transaction.atomic
    def update(self, instance, validated_data):
        if "items" not in validated_data:
            return super().update(instance, validated_data)

        items_data = validated_data.pop("items")
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        existing = {ri.item_id: ri for ri in instance.items.all()}
        keep_ids = set()
        for entry in items_data:
            item = entry["item"]
            keep_ids.add(item.id)
            obj, _ = ReportItem.objects.update_or_create(
                report=instance,
                item=item,
                defaults={
                    "rating": entry.get("rating", ""),
                    "description": entry.get("description", ""),
                },
            )
        # 删除前端未提交的检测项（连带删除其照片）
        instance.items.exclude(item_id__in=keep_ids).delete()

        instance.recalculate_score()
        instance.save(update_fields=["overall_score"])
        return instance
