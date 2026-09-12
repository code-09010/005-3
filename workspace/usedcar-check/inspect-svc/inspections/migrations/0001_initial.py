import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="InspectionItem",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("code", models.CharField(max_length=32, unique=True, verbose_name="项目编码")),
                ("name", models.CharField(max_length=64, verbose_name="项目名称")),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("动力系统", "动力系统"),
                            ("底盘操控", "底盘操控"),
                            ("车身外观", "车身外观"),
                            ("内饰电子", "内饰电子"),
                            ("其他", "其他"),
                        ],
                        default="其他",
                        max_length=32,
                        verbose_name="分组",
                    ),
                ),
                ("weight", models.PositiveIntegerField(default=5, verbose_name="权重")),
                ("sort_order", models.PositiveIntegerField(default=0, verbose_name="排序")),
            ],
            options={
                "verbose_name": "检测项",
                "verbose_name_plural": "检测项",
                "ordering": ["sort_order", "id"],
            },
        ),
        migrations.CreateModel(
            name="Report",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("brand", models.CharField(max_length=64, verbose_name="品牌")),
                ("model", models.CharField(max_length=64, verbose_name="型号")),
                ("year", models.PositiveIntegerField(verbose_name="年份")),
                ("mileage", models.PositiveIntegerField(verbose_name="里程(km)")),
                (
                    "overall_score",
                    models.DecimalField(
                        blank=True,
                        decimal_places=1,
                        max_digits=5,
                        null=True,
                        verbose_name="综合评分",
                    ),
                ),
                ("inspector", models.CharField(blank=True, default="", max_length=64, verbose_name="检测员")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="创建时间")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="更新时间")),
            ],
            options={
                "verbose_name": "检测报告",
                "verbose_name_plural": "检测报告",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="ReportItem",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "rating",
                    models.CharField(
                        blank=True,
                        choices=[("优", "优"), ("良", "良"), ("中", "中"), ("差", "差")],
                        max_length=4,
                        verbose_name="评级",
                    ),
                ),
                ("description", models.TextField(blank=True, default="", verbose_name="状况描述")),
                (
                    "item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="report_items",
                        to="inspections.inspectionitem",
                    ),
                ),
                (
                    "report",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="inspections.report",
                    ),
                ),
            ],
            options={
                "verbose_name": "检测项结果",
                "verbose_name_plural": "检测项结果",
                "unique_together": {("report", "item")},
            },
        ),
        migrations.CreateModel(
            name="ReportItemPhoto",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "image",
                    models.ImageField(upload_to="photos/%Y/%m/", verbose_name="照片"),
                ),
                ("caption", models.CharField(blank=True, default="", max_length=128, verbose_name="备注")),
                ("uploaded_at", models.DateTimeField(auto_now_add=True, verbose_name="上传时间")),
                (
                    "report_item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="photos",
                        to="inspections.reportitem",
                    ),
                ),
            ],
            options={
                "verbose_name": "检测项照片",
                "verbose_name_plural": "检测项照片",
                "ordering": ["id"],
            },
        ),
    ]
