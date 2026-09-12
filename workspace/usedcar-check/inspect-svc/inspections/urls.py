from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    InspectionItemViewSet,
    PhotoDetailView,
    PhotoUploadView,
    ReportViewSet,
)

router = DefaultRouter()
router.register("items", InspectionItemViewSet, basename="item")
router.register("reports", ReportViewSet, basename="report")

urlpatterns = [
    path("photos/", PhotoUploadView.as_view(), name="photo-upload"),
    path("photos/<int:pk>/", PhotoDetailView.as_view(), name="photo-detail"),
    path("", include(router.urls)),
]
