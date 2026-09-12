from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import InspectionItem, Report, ReportItem, ReportItemPhoto
from .scoring import RATING_SCORES
from .serializers import (
    InspectionItemSerializer,
    ReportItemPhotoSerializer,
    ReportSerializer,
)


class InspectionItemViewSet(viewsets.ReadOnlyModelViewSet):
    """标准检测项目录"""

    queryset = InspectionItem.objects.all()
    serializer_class = InspectionItemSerializer
    pagination_class = None


class ReportViewSet(viewsets.ModelViewSet):
    """检测报告：嵌套写入检测项，保存后自动重算综合评分"""

    queryset = (
        Report.objects.prefetch_related(
            "items__photos", "items__item"
        ).all()
    )
    serializer_class = ReportSerializer

    @action(detail=False, methods=["get"])
    def compare(self, request):
        """
        多报告并排对比。
        GET /api/reports/compare?ids=1,2,3 （最多 4 份）
        返回按检测项目录对齐的矩阵，前端据此高亮差异较大的项。
        """
        raw = request.query_params.get("ids", "")
        try:
            ids = [int(x) for x in raw.split(",") if x.strip()]
        except ValueError:
            return Response(
                {"detail": "ids 参数格式错误，应为逗号分隔的数字"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not ids:
            return Response(
                {"detail": "请通过 ids 传入至少一份报告"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(ids) > 4:
            return Response(
                {"detail": "最多同时对比 4 份报告"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reports = list(
            Report.objects.prefetch_related("items__photos", "items__item").filter(
                id__in=ids
            )
        )
        # 综合评分高的在前（未评分 None 视为最低），避免 PG DESC 默认 NULLS FIRST
        reports.sort(
            key=lambda r: float(r.overall_score) if r.overall_score is not None else -1,
            reverse=True,
        )
        found = {r.id for r in reports}
        missing = [i for i in ids if i not in found]
        if missing:
            return Response(
                {"detail": f"报告不存在: {missing}"},
                status=status.HTTP_404_NOT_FOUND,
            )

        items = InspectionItem.objects.all()
        report_payloads = [ReportSerializer(r, context={"request": request}).data for r in reports]
        item_results_by_report = []
        for report in reports:
            item_results_by_report.append(
                {ri.item_id: ri for ri in report.items.all()}
            )

        rows = []
        for item in items:
            row = {
                "item": InspectionItemSerializer(item).data,
                "cells": [],
            }
            for report, results in zip(reports, item_results_by_report):
                result = results.get(item.id)
                if result is None:
                    cell = {
                        "report": report.id,
                        "rating": None,
                        "score": None,
                        "description": "",
                        "photos": [],
                    }
                else:
                    rating = result.rating or None
                    cell = {
                        "report": report.id,
                        "rating": rating,
                        "score": RATING_SCORES[rating] if rating else None,
                        "description": result.description,
                        "photos": ReportItemPhotoSerializer(
                            result.photos.all(), many=True,
                            context={"request": request},
                        ).data,
                    }
                row["cells"].append(cell)
            rows.append(row)

        return Response(
            {
                "reports": report_payloads,
                "rows": rows,
            }
        )


class PhotoUploadView(APIView):
    """上传检测项照片：POST /api/photos/  multipart 字段 image / report_item / caption"""

    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        upload = request.FILES.get("image")
        if upload is None:
            return Response(
                {"detail": "缺少 image 文件字段"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if upload.size > settings.MAX_PHOTO_SIZE:
            return Response(
                {"detail": "图片不能超过 10MB"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        report_item_id = request.data.get("report_item")
        if not report_item_id:
            return Response(
                {"detail": "缺少 report_item 字段"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            report_item = ReportItem.objects.select_related("item").get(
                id=report_item_id
            )
        except (ReportItem.DoesNotExist, ValueError):
            return Response(
                {"detail": "检测项结果不存在"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # 用 Pillow 校验确实是图片（同时拒绝伪造后缀）
        from PIL import Image

        try:
            image = Image.open(upload)
            image.verify()
            upload.seek(0)
        except Exception:
            return Response(
                {"detail": "文件不是有效的图片"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        caption = (request.data.get("caption") or "")[:128]
        photo = ReportItemPhoto.objects.create(
            report_item=report_item, image=upload, caption=caption
        )
        return Response(
            ReportItemPhotoSerializer(photo, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class PhotoDetailView(APIView):
    """删除单张照片：DELETE /api/photos/{id}/"""

    def delete(self, request, pk):
        deleted, _ = ReportItemPhoto.objects.filter(id=pk).delete()
        if not deleted:
            return Response(
                {"detail": "照片不存在"}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(status=status.HTTP_204_NO_CONTENT)
