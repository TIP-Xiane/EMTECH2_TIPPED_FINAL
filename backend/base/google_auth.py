import base64
import hashlib
import secrets
import time
import uuid
from urllib.parse import urlencode, urlparse
import requests
from google.auth.transport.requests import Request
from google.auth.exceptions import GoogleAuthError
from google.oauth2.id_token import verify_oauth2_token
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction, IntegrityError
from django.http import HttpResponseRedirect
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .accounts import PublicAccountView, COOKIE, COOKIE_PATH, REGISTRATION_MESSAGE
from .models import AccountProfile, GoogleIdentity
from rest_framework_simplejwt.tokens import RefreshToken

def enabled():
    callback=urlparse(settings.GOOGLE_REDIRECT_URI)
    safe=callback.scheme=="https" or (settings.DEBUG and callback.scheme=="http" and callback.hostname in ["127.0.0.1","localhost"])
    return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET and safe and callback.path=="/api/auth/google/callback/" and not callback.query and not callback.fragment and not callback.username)

def result(code):
    response=HttpResponseRedirect("/login?"+urlencode({"google":code}))
    response["Cache-Control"]="no-store"
    response["Referrer-Policy"]="no-referrer"
    return response

class ProviderConfig(APIView):
    authentication_classes=[]
    permission_classes=[]
    def get(self,request):
        response=Response({"google_enabled":enabled()})
        response["Cache-Control"]="no-store"
        return response

def begin(request, link_user=None):
    if not enabled(): return Response({"detail":"Google sign-in is not configured."},status=503)
    verifier=secrets.token_urlsafe(48)
    state=secrets.token_urlsafe(32)
    nonce=secrets.token_urlsafe(32)
    request.session.cycle_key()
    request.session["google_oauth"]={"state":state,"nonce":nonce,"verifier":verifier,"at":time.time(),"link_user":link_user}
    challenge=base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    query={"client_id":settings.GOOGLE_CLIENT_ID,"redirect_uri":settings.GOOGLE_REDIRECT_URI,"response_type":"code","scope":"openid email profile","state":state,"nonce":nonce,"code_challenge":challenge,"code_challenge_method":"S256","prompt":"select_account"}
    return Response({"url":"https://accounts.google.com/o/oauth2/v2/auth?"+urlencode(query)})

class GoogleStart(PublicAccountView):
    def post(self,request): return begin(request)

class GoogleLinkStart(PublicAccountView):
    # JWT authentication is explicit; public registration can never assign a link target.
    from rest_framework_simplejwt.authentication import JWTAuthentication
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsAuthenticated]
    def post(self,request):
        if request.user.is_staff or not hasattr(request.user,"account_profile"):
            return Response({"detail":"A student account is required."},status=403)
        return begin(request,request.user.pk)

def exchange_and_verify(code,flow):
    response=requests.post("https://oauth2.googleapis.com/token",data={"code":code,"client_id":settings.GOOGLE_CLIENT_ID,"client_secret":settings.GOOGLE_CLIENT_SECRET,"redirect_uri":settings.GOOGLE_REDIRECT_URI,"grant_type":"authorization_code","code_verifier":flow["verifier"]},timeout=15)
    response.raise_for_status()
    token=response.json()["id_token"]
    transport=Request()
    claims=verify_oauth2_token(token,lambda *args,**kwargs: transport(*args,**{**kwargs,"timeout":10}),audience=settings.GOOGLE_CLIENT_ID)
    if not secrets.compare_digest(str(claims.get("nonce","")),flow["nonce"]): raise ValueError("Invalid nonce")
    if claims.get("email_verified") is not True or not claims.get("sub") or not claims.get("email"): raise ValueError("Unverified identity")
    domains=[domain.strip().lower() for domain in settings.GOOGLE_ALLOWED_DOMAINS]
    if domains and claims.get("hd","").lower() not in domains: raise ValueError("Domain not eligible")
    return claims

def callback(request):
    flow=request.session.pop("google_oauth",None)
    if not enabled() or not flow or time.time()-flow.get("at",0)>600 or not secrets.compare_digest(str(request.GET.get("state","")),flow.get("state","")):
        return result("failed")
    if request.GET.get("error"): return result("cancelled")
    code=request.GET.get("code","")
    if not code or len(code)>4096: return result("failed")
    try:
        claims=exchange_and_verify(code,flow)
        subject=str(claims["sub"])
        email=claims["email"].strip().lower()
        if len(subject)>255 or len(email)>254: return result("failed")
        existing=GoogleIdentity.objects.select_related("user").filter(subject=subject).first()
        if flow.get("link_user"):
            profile=AccountProfile.objects.select_related("user").filter(user_id=flow["link_user"],email=email,user__is_active=True,user__is_staff=False,user__is_superuser=False).first()
            if not profile or (existing and existing.user_id!=profile.user_id): return result("link_failed")
            with transaction.atomic(): GoogleIdentity.objects.get_or_create(user=profile.user,defaults={"subject":subject})
            if profile.user.google_identity.subject!=subject: return result("link_failed")
            return result("linked")
        if existing:
            user=existing.user
            if not user.is_active: return result("pending")
            if user.is_staff or user.is_superuser or not hasattr(user,"account_profile"): return result("failed")
            refresh=RefreshToken.for_user(user)
            response=result("success")
            response.set_cookie(COOKIE,str(refresh),httponly=True,secure=not settings.DEBUG,samesite="Lax",path=COOKIE_PATH,max_age=86400)
            return response
        # Never automatically take over an existing password account by matching email.
        if AccountProfile.objects.filter(email=email).exists() or get_user_model().objects.filter(email__iexact=email).exists(): return result("link_required")
        request.session["google_pending"]={"subject":subject,"email":email,"name":str(claims.get("name",""))[:150],"at":time.time()}
        response=HttpResponseRedirect("/register?google=complete")
        response["Cache-Control"]="no-store";response["Referrer-Policy"]="no-referrer"
        return response
    except (requests.RequestException,GoogleAuthError,ValueError,KeyError,IntegrityError):
        # Never return token, client secret, authorization code or provider exception text.
        return result("failed")

class GoogleProfileSerializer(serializers.Serializer):
    name=serializers.CharField(max_length=150)
    number=serializers.CharField(max_length=50)
    program=serializers.CharField(max_length=100)
    site=serializers.ChoiceField(choices=["Arlegui","Casal","Other"])
    def to_internal_value(self,data):
        if set(data)-set(self.fields): raise serializers.ValidationError({"detail": "Unexpected profile fields."})
        return super().to_internal_value(data)

class GoogleComplete(PublicAccountView):
    throttle_scope="registration"
    def get(self,request):
        pending=request.session.get("google_pending",{})
        if time.time()-pending.get("at",0)>600: return Response({"detail":"Google sign-in expired. Please start again."},status=400)
        return Response({"name":pending["name"],"email":pending["email"]})
    def post(self,request):
        pending=request.session.get("google_pending",{})
        if time.time()-pending.get("at",0)>600: return Response({"detail":"Google sign-in expired. Please start again."},status=400)
        serializer=GoogleProfileSerializer(data=request.data);serializer.is_valid(raise_exception=True)
        data=serializer.validated_data
        try:
            with transaction.atomic():
                if not AccountProfile.objects.filter(email=pending["email"]).exists() and not get_user_model().objects.filter(email__iexact=pending["email"]).exists():
                    user=get_user_model()(username="student_"+uuid.uuid4().hex,email=pending["email"],is_active=False,is_staff=False,is_superuser=False)
                    user.set_unusable_password();user.save()
                    AccountProfile.objects.create(user=user,email=pending["email"],full_name=data["name"],student_number=data["number"],program=data["program"],site=data["site"])
                    GoogleIdentity.objects.create(user=user,subject=pending["subject"])
        except IntegrityError:
            if not (GoogleIdentity.objects.filter(subject=pending["subject"]).exists() or AccountProfile.objects.filter(email=pending["email"]).exists()): raise
        request.session.pop("google_pending",None)
        return Response({"message":REGISTRATION_MESSAGE},status=202)
