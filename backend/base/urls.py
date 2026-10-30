from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from .views import ReportViewSet, CampusViewSet, CategoryViewSet, LoginView, health, me
from .accounts import csrf, RegisterView, AccountLoginView, CookieRefreshView, AccountLogoutView, AccountView
router = DefaultRouter()
router.register("reports", ReportViewSet, basename="report")
router.register("campuses", CampusViewSet)
router.register("categories", CategoryViewSet)
urlpatterns = [path("api/auth/csrf/", csrf), path("api/auth/register/", RegisterView.as_view()), path("api/auth/login/", AccountLoginView.as_view()), path("api/auth/refresh/", CookieRefreshView.as_view()), path("api/auth/signout/", AccountLogoutView.as_view()), path("api/auth/account/", AccountView.as_view()), path("api/health/", health), path("api/auth/token/", LoginView.as_view()), path("api/auth/token/refresh/", TokenRefreshView.as_view()), path("api/auth/logout/", TokenBlacklistView.as_view()), path("api/auth/me/", me), path("api/session/", include("rest_framework.urls")), path("api/", include(router.urls))]
