from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from django.views.static import serve

urlpatterns = [
    path("api/admin/", admin.site.urls),
    path("api/", include("inspections.urls")),
    # gunicorn 直接托管静态/媒体文件（容器内卷），生产可前置独立 nginx
    path(
        "media/<path:path>",
        serve,
        kwargs={"document_root": settings.MEDIA_ROOT},
    ),
    path(
        "static/<path:path>",
        serve,
        kwargs={"document_root": settings.STATIC_ROOT},
    ),
]
