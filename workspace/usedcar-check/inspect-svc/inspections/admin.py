from django.contrib import admin

from .models import InspectionItem, Report, ReportItem, ReportItemPhoto


class ReportItemPhotoInline(admin.TabularInline):
    model = ReportItemPhoto
    extra = 0
    readonly_fields = ("uploaded_at",)


class ReportItemInline(admin.TabularInline):
    model = ReportItem
    extra = 0
    fields = ("item", "rating", "description")
    autocomplete_fields = ("item",)


@admin.register(InspectionItem)
class InspectionItemAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "category", "weight", "sort_order")
    list_filter = ("category",)
    search_fields = ("name", "code")
    list_editable = ("weight", "sort_order")


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "brand",
        "model",
        "year",
        "mileage",
        "overall_score",
        "inspector",
        "created_at",
    )
    list_filter = ("brand", "year")
    search_fields = ("brand", "model", "inspector")
    inlines = (ReportItemInline,)
    readonly_fields = ("created_at", "updated_at")


@admin.register(ReportItem)
class ReportItemAdmin(admin.ModelAdmin):
    list_display = ("report", "item", "rating")
    inlines = (ReportItemPhotoInline,)


@admin.register(ReportItemPhoto)
class ReportItemPhotoAdmin(admin.ModelAdmin):
    list_display = ("id", "report_item", "caption", "uploaded_at")
