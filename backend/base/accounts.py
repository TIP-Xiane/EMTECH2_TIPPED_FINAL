import uuid
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from .models import AccountProfile

REGISTRATION_MESSAGE = "If this email is eligible and not already registered, an account request has been saved. Administrator approval is required before sign-in. If you already registered, use Sign in or contact the administrator."
COOKIE = "tipped_refresh"
COOKIE_PATH = "/api/auth/"

@ensure_csrf_cookie
def csrf(request):
    response = JsonResponse({"csrfToken": get_token(request)})
    response["Cache-Control"] = "no-store"
    return response

def identity(user):
    profile = user.account_profile
    return {"id": str(user.pk), "name": profile.full_name, "email": profile.email, "number": profile.student_number, "program": profile.program, "site": profile.site, "role": "student", "sites": []}

class RegistrationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(write_only=True, min_length=12, max_length=128, trim_whitespace=False)
    number = serializers.CharField(max_length=50)
    program = serializers.CharField(max_length=100)
    site = serializers.ChoiceField(choices=["Arlegui", "Casal", "Other"])
    def to_internal_value(self, data):
        unknown = set(data) - set(self.fields)
        if unknown: raise serializers.ValidationError({key: "This field cannot be submitted." for key in unknown})
        return super().to_internal_value(data)
    def validate(self, data):
        data["email"] = data["email"].strip().lower()
        prospective = get_user_model()(email=data["email"], first_name=data["name"])
        try: validate_password(data["password"], user=prospective)
        except DjangoValidationError as error: raise serializers.ValidationError({"password": error.messages})
        return data

@method_decorator(csrf_protect, name="dispatch")
class PublicAccountView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"
    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "no-store"
        return response

class RegisterView(PublicAccountView):
    throttle_scope = "registration"
    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        # Until official eligibility is defined, every new account requires operator approval.
        if get_user_model().objects.filter(email__iexact=data["email"]).exists() or AccountProfile.objects.filter(email=data["email"]).exists():
            return Response({"message": REGISTRATION_MESSAGE}, status=202)
        try:
            with transaction.atomic():
                user = get_user_model().objects.create_user(username="student_" + uuid.uuid4().hex, email=data["email"], password=data["password"], is_active=False, is_staff=False, is_superuser=False)
                AccountProfile.objects.create(user=user, email=data["email"], full_name=data["name"], student_number=data["number"], program=data["program"], site=data["site"])
        except IntegrityError:
            # Concurrent duplicate signup must not reset credentials or create an orphan user.
            if not AccountProfile.objects.filter(email=data["email"]).exists(): raise
        return Response({"message": REGISTRATION_MESSAGE}, status=status.HTTP_202_ACCEPTED)

def token_response(user):
    refresh = RefreshToken.for_user(user)
    response = Response({"user": identity(user), "access": str(refresh.access_token)})
    response.set_cookie(COOKIE, str(refresh), max_age=86400, httponly=True, secure=not settings.DEBUG, samesite="Lax", path=COOKIE_PATH)
    return response

class AccountLoginView(PublicAccountView):
    def post(self, request):
        email = request.data.get("email", "")
        password = request.data.get("password", "")
        if not isinstance(email,str) or not isinstance(password,str) or len(email)>254 or len(password)>128:
            return Response({"detail":"Unable to sign in. Check your details and account approval."},status=401)
        profile = AccountProfile.objects.select_related("user").filter(email=email.strip().lower()).first()
        username = profile.user.username if profile else "nonexistent_" + uuid.uuid4().hex
        user = authenticate(request=request, username=username, password=password)
        if user is None or user.is_staff or user.is_superuser:
            return Response({"detail":"Unable to sign in. Check your details and account approval. Student registration does not grant OSA access."},status=401)
        return token_response(user)

class CookieRefreshView(PublicAccountView):
    def post(self, request):
        try:
            old = RefreshToken(request.COOKIES.get(COOKIE, ""))
            user = get_user_model().objects.get(pk=old["user_id"], is_active=True, is_staff=False, is_superuser=False)
            if not AccountProfile.objects.filter(user=user).exists(): raise TokenError("No student profile")
            old.blacklist()
            return token_response(user)
        except (TokenError, get_user_model().DoesNotExist, KeyError):
            response = Response({"detail":"Please sign in again."},status=401)
            response.delete_cookie(COOKIE,path=COOKIE_PATH,samesite="Lax")
            return response

class AccountLogoutView(PublicAccountView):
    def post(self, request):
        try: RefreshToken(request.COOKIES.get(COOKIE, "")).blacklist()
        except TokenError: pass
        response = Response(status=204)
        response.delete_cookie(COOKIE,path=COOKIE_PATH,samesite="Lax")
        return response

class AccountView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request):
        if not hasattr(request.user,"account_profile") or request.user.is_staff:
            return Response({"detail":"A registered student account is required."},status=403)
        response = Response({"user":identity(request.user)})
        response["Cache-Control"]="no-store"
        return response
