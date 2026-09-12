from django.db import models

from .scoring import RATING_CHOICES, RATING_SCORES


class InspectionItem(models.Model):
    """标准检测项目录（如：发动机、变速箱、底盘……），权重可在 Admin 调整。"""

    CATEGORY_CHOICES = [
        ("动力系统", "动力系统"),
        ("底盘操控", "底盘操控"),
        ("车身外观", "车身外观"),
        ("内饰电子", "内饰电子"),
        ("其他", "其他"),
    ]

    code = models.CharField("项目编码", max_length=32, unique=True)
    name = models.CharField("项目名称", max_length=64)
    category = models.CharField(
        "分组", max_length=32, choices=CATEGORY_CHOICES, default="其他"
    )
    weight = models.PositiveIntegerField("权重", default=5)
    sort_order = models.PositiveIntegerField("排序", default=0)

    class Meta:
        verbose_name = "检测项"
        verbose_name_plural = "检测项"
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.name}(权重{self.weight})"


class Report(models.Model):
    """一份二手车检测报告（头信息 + 多个检测项结果）。"""

    brand = models.CharField("品牌", max_length=64)
    model = models.CharField("型号", max_length=64)
    year = models.PositiveIntegerField("年份")
    mileage = models.PositiveIntegerField("里程(km)")
    overall_score = models.DecimalField(
        "综合评分", max_digits=5, decimal_places=1, null=True, blank=True
    )
    inspector = models.CharField("检测员", max_length=64, blank=True)
    created_at = models.DateTimeField("创建时间", auto_now_add=True)
    updated_at = models.DateTimeField("更新时间", auto_now=True)

    class Meta:
        verbose_name = "检测报告"
        verbose_name_plural = "检测报告"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.brand} {self.model} {self.year} - {self.overall_score or '未评分'}"

    def recalculate_score(self):
        """按各检测项评级与权重重新计算综合评分。"""
        items = self.items.filter(rating__in=RATING_SCORES.keys())
        weighted_sum = sum(
            RATING_SCORES[item.rating] * item.item.weight for item in items
        )
        total_weight = sum(item.item.weight for item in items)
        if total_weight == 0:
            self.overall_score = None
        else:
            self.overall_score = round(weighted_sum / total_weight, 1)
        return self.overall_score


class ReportItem(models.Model):
    """报告中单个检测项的结果。"""

    report = models.ForeignKey(
        Report, related_name="items", on_delete=models.CASCADE
    )
    item = models.ForeignKey(
        InspectionItem, related_name="report_items", on_delete=models.PROTECT
    )
    rating = models.CharField(
        "评级", max_length=4, choices=[(r, r) for r in RATING_CHOICES], blank=True
    )
    description = models.TextField("状况描述", blank=True, default="")

    class Meta:
        verbose_name = "检测项结果"
        verbose_name_plural = "检测项结果"
        unique_together = ("report", "item")

    def __str__(self):
        return f"{self.item.name}: {self.rating or '未评'}"


class ReportItemPhoto(models.Model):
    """检测项照片，文件存本地文件系统。"""

    report_item = models.ForeignKey(
        ReportItem, related_name="photos", on_delete=models.CASCADE
    )
    image = models.ImageField("照片", upload_to="photos/%Y/%m/")
    caption = models.CharField("备注", max_length=128, blank=True, default="")
    uploaded_at = models.DateTimeField("上传时间", auto_now_add=True)

    class Meta:
        verbose_name = "检测项照片"
        verbose_name_plural = "检测项照片"
        ordering = ["id"]

    def __str__(self):
        return f"照片 {self.id} - {self.report_item.item.name}"
