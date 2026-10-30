from django.test import TestCase
from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from .models import AccountProfile

class AccountSecurityTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client=APIClient(enforce_csrf_checks=True)
        self.payload={"name":"Fictional Student","email":"person@example.invalid","password":"Unique-fixture!2026","number":"FAKE-ONLY","program":"Sample","site":"Arlegui"}
        self.token=self.client.get("/api/auth/csrf/").json()["csrfToken"]
        self.client.credentials(HTTP_X_CSRFTOKEN=self.token)
    def register(self): return self.client.post("/api/auth/register/",self.payload,format="json")
    def activate(self):
        self.register();user=User.objects.get(email=self.payload["email"]);user.is_active=True;user.save();return user
    def login(self): return self.client.post("/api/auth/login/",{"email":self.payload["email"],"password":self.payload["password"]},format="json")
    def test_registration_pending_hashed_and_no_privileges(self):
        self.assertEqual(self.register().status_code,202)
        user=User.objects.get(email=self.payload["email"])
        self.assertFalse(user.is_active);self.assertFalse(user.is_staff);self.assertFalse(user.is_superuser)
        self.assertNotEqual(user.password,self.payload["password"]);self.assertTrue(user.check_password(self.payload["password"]))
        self.assertEqual(self.login().status_code,401)
    def test_duplicate_casefold_does_not_reset_password(self):
        self.register();self.payload["email"]="PERSON@EXAMPLE.INVALID";self.payload["password"]="Other-fixture!2026"
        self.assertEqual(self.register().status_code,202)
        self.assertEqual(User.objects.filter(email__iexact="person@example.invalid").count(),1)
        self.assertTrue(User.objects.get(email="person@example.invalid").check_password("Unique-fixture!2026"))
    def test_privilege_injection_and_weak_password_rejected(self):
        for key in ["is_staff","is_superuser","role","is_active","sites"]:
            result=self.client.post("/api/auth/register/",{**self.payload,key:True},format="json");self.assertEqual(result.status_code,400)
        cache.clear();self.payload["password"]="password";self.assertEqual(self.register().status_code,400)
        self.assertFalse(AccountProfile.objects.exists())
    def test_csrf_and_foreign_origin_rejected(self):
        bare=APIClient(enforce_csrf_checks=True)
        for path in ["register","login","refresh","signout"]:
            self.assertEqual(bare.post(f"/api/auth/{path}/",{},format="json").status_code,403)
        self.assertEqual(self.client.post("/api/auth/register/",self.payload,format="json",HTTP_ORIGIN="https://untrusted.invalid").status_code,403)
    def test_approved_login_cookie_refresh_and_logout(self):
        self.activate();response=self.login();self.assertEqual(response.status_code,200)
        cookie=response.cookies["tipped_refresh"]
        self.assertTrue(cookie["httponly"]);self.assertEqual(cookie["samesite"],"Lax");self.assertEqual(cookie["path"],"/api/auth/")
        self.assertNotIn("refresh",response.data)
        old=cookie.value
        self.client.credentials(HTTP_X_CSRFTOKEN=self.token,HTTP_AUTHORIZATION="Bearer "+response.data["access"])
        self.assertEqual(self.client.get("/api/auth/account/").data["user"]["role"],"student")
        self.assertEqual(self.client.post("/api/auth/refresh/").status_code,200)
        from rest_framework_simplejwt.exceptions import TokenError
        with self.assertRaises(TokenError): RefreshToken(old)
        self.assertEqual(self.client.post("/api/auth/signout/").status_code,204)
        self.assertEqual(self.client.post("/api/auth/refresh/").status_code,401)
    def test_deactivation_blocks_access_and_refresh(self):
        user=self.activate();response=self.login();user.is_active=False;user.save()
        self.client.credentials(HTTP_X_CSRFTOKEN=self.token,HTTP_AUTHORIZATION="Bearer "+response.data["access"])
        self.assertEqual(self.client.get("/api/auth/account/").status_code,401)
        self.assertEqual(self.client.post("/api/auth/refresh/").status_code,401)
    def test_student_cannot_access_admin_profiles(self):
        user=self.activate();self.client.force_login(user)
        self.assertEqual(self.client.get("/admin/reports/accountprofile/").status_code,302)
