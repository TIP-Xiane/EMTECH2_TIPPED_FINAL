from django.db.models import Q
from rest_framework import viewsets, permissions, mixins
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import ItemReport, Campus, Category
from .serializers import ReportSerializer, CampusSerializer, CategorySerializer

class LoginView(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(request): return Response({"status": "ok", "service": "tipped-django"})

@api_view(["GET"])
def me(request): return Response({"id": request.user.pk, "username": request.user.username, "is_staff": request.user.is_staff})

class CampusViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Campus.objects.filter(active=True).order_by("id")
    serializer_class = CampusSerializer
    permission_classes = [permissions.AllowAny]

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(active=True).order_by("id")
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

class ReportViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    serializer_class = ReportSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]
    def get_permissions(self):
        return [permissions.AllowAny() if self.action in ["list", "retrieve"] else permissions.IsAuthenticated()]
    def get_queryset(self):
        qs = ItemReport.objects.select_related("campus", "category")
        user = self.request.user
        if self.action == "mine": qs = qs.filter(reporter=user)
        elif self.action in ["partial_update", "update"]: qs = qs.filter(reporter=user)
        elif self.action == "retrieve" and user.is_authenticated:
            qs = qs.filter(Q(review_status="APPROVED") | Q(reporter=user))
        else: qs = qs.filter(review_status="APPROVED")
        for key in ["campus_id", "category_id"]:
            value = self.request.query_params.get(key)
            if value:
                from rest_framework.exceptions import ValidationError
                if not value.isdigit() or len(value) > 9: raise ValidationError({key: "Expected a numeric ID."})
                qs = qs.filter(**{key: int(value)})
        value = self.request.query_params.get("report_type")
        if value: qs = qs.filter(report_type=value)
        search = self.request.query_params.get("search", "")[:200]
        if search: qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))
        return qs
    def perform_create(self, serializer): serializer.save(reporter=self.request.user)
    def perform_update(self, serializer):
        if serializer.instance.review_status != "PENDING_REVIEW":
            raise PermissionDenied("Only pending reports can be edited.")
        serializer.save()
    @action(detail=False, methods=["get"], url_path="mine")
    def mine(self, request): return self.list(request)
