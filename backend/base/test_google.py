import time
from unittest.mock import patch
from urllib.parse import urlparse, parse_qs
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework.test import APIClient
from .models import AccountProfile, GoogleIdentity
from .google_auth import exchange_and_verify

@override_settings(GOOGLE_CLIENT_ID="fixture-client",GOOGLE_CLIENT_SECRET="fixture-secret",GOOGLE_REDIRECT_URI="http://127.0.0.1:5173/api/auth/google/callback/",DEBUG=True)
class GoogleSecurityTests(TestCase):
    def setUp(self):
        cache.clear();self.client=APIClient(enforce_csrf_checks=True)
        self.csrf=self.client.get("/api/auth/csrf/").json()["csrfToken"]
        self.client.credentials(HTTP_X_CSRFTOKEN=self.csrf)
    def start(self):
        response=self.client.post("/api/auth/google/start/")
        self.assertEqual(response.status_code,200)
        return parse_qs(urlparse(response.data["url"]).query)
    def account(self,email="person@example.invalid"):
        user=User.objects.create_user("existing",email=email,password="Fixture-only!2026")
        AccountProfile.objects.create(user=user,email=email,full_name="Fictional Student",student_number="FICTION",program="Sample",site="Arlegui")
        return user
    def claims(self):return {"sub":"google-subject","email":"person@example.invalid","email_verified":True,"name":"Fictional Student"}
    def test_provider_disabled_and_no_secret_disclosure(self):
        with override_settings(GOOGLE_CLIENT_SECRET=""):
            self.assertFalse(self.client.get("/api/auth/providers/").data["google_enabled"])
            self.assertEqual(self.client.post("/api/auth/google/start/").status_code,503)
        self.assertNotIn("fixture-secret",str(self.client.get("/api/auth/providers/").data))
    def test_start_csrf_pkce_nonce_and_scope(self):
        bare=APIClient(enforce_csrf_checks=True);self.assertEqual(bare.post("/api/auth/google/start/").status_code,403)
        query=self.start();self.assertEqual(query["scope"],["openid email profile"])
        self.assertEqual(query["code_challenge_method"],["S256"])
        self.assertTrue(query["nonce"]);self.assertNotIn("client_secret",query)
    @patch("base.google_auth.exchange_and_verify")
    def test_wrong_state_and_expiry_rejected_before_exchange(self,exchange):
        query=self.start()
        self.assertIn("google=failed",self.client.get("/api/auth/google/callback/?state=wrong&code=x").url)
        self.assertFalse(exchange.called)
        self.start();session=self.client.session;flow=session["google_oauth"];flow["at"]=time.time()-601;session["google_oauth"]=flow;session.save()
        self.assertIn("google=failed",self.client.get("/api/auth/google/callback/",{"state":flow["state"],"code":"x"}).url)
        self.assertFalse(exchange.called)
    @patch("base.google_auth.exchange_and_verify")
    def test_existing_email_not_automatically_linked(self,exchange):
        self.account();exchange.return_value=self.claims();query=self.start()
        response=self.client.get("/api/auth/google/callback/",{"state":query["state"][0],"code":"fixture"})
        self.assertIn("google=link_required",response.url);self.assertFalse(GoogleIdentity.objects.exists())
    @patch("base.google_auth.exchange_and_verify")
    def test_google_signup_requires_profile_and_admin_approval(self,exchange):
        exchange.return_value=self.claims();query=self.start()
        response=self.client.get("/api/auth/google/callback/",{"state":query["state"][0],"code":"fixture"})
        self.assertEqual(response.url,"/register?google=complete");self.assertFalse(User.objects.exists())
        self.assertEqual(self.client.post("/api/auth/google/complete/",{"name":"Fiction","number":"DEMO","program":"Sample","site":"Arlegui","is_staff":True},format="json").status_code,400)
        response=self.client.post("/api/auth/google/complete/",{"name":"Fiction","number":"DEMO","program":"Sample","site":"Arlegui"},format="json")
        self.assertEqual(response.status_code,202)
        user=User.objects.get();self.assertFalse(user.is_active);self.assertFalse(user.is_staff);self.assertFalse(user.has_usable_password())
        self.assertEqual(GoogleIdentity.objects.get().user,user)
        self.assertEqual(self.client.post("/api/auth/google/complete/",{},format="json").status_code,400)
    @patch("base.google_auth.exchange_and_verify")
    def test_only_approved_linked_identity_gets_session(self,exchange):
        user=self.account();GoogleIdentity.objects.create(user=user,subject="google-subject");exchange.return_value=self.claims()
        query=self.start();response=self.client.get("/api/auth/google/callback/",{"state":query["state"][0],"code":"fixture"})
        self.assertIn("google=success",response.url);self.assertTrue(response.cookies["tipped_refresh"]["httponly"])
        self.assertNotIn("access",response.url)
        user.is_active=False;user.save();query=self.start();response=self.client.get("/api/auth/google/callback/",{"state":query["state"][0],"code":"fixture"})
        self.assertIn("google=pending",response.url);self.assertNotIn("tipped_refresh",response.cookies)
    @patch("base.google_auth.exchange_and_verify")
    def test_explicit_link_requires_auth_and_matching_email(self,exchange):
        self.assertEqual(self.client.post("/api/auth/google/link/").status_code,401)
        user=self.account();self.client.force_authenticate(user);exchange.return_value={**self.claims(),"email":"other@example.invalid"}
        response=self.client.post("/api/auth/google/link/");query=parse_qs(urlparse(response.data["url"]).query)
        response=self.client.get("/api/auth/google/callback/",{"state":query["state"][0],"code":"fixture"})
        self.assertIn("google=link_failed",response.url);self.assertFalse(GoogleIdentity.objects.exists())
    @patch("base.google_auth.verify_oauth2_token")
    @patch("base.google_auth.requests.post")
    def test_server_verification_nonce_and_domain(self,post,verify):
        post.return_value.json.return_value={"id_token":"fixture-token"}
        flow={"nonce":"expected","verifier":"fixture-pkce"}
        verify.return_value={**self.claims(),"nonce":"wrong"}
        with self.assertRaises(ValueError):exchange_and_verify("code",flow)
        verify.return_value={**self.claims(),"nonce":"expected","email_verified":False}
        with self.assertRaises(ValueError):exchange_and_verify("code",flow)
        verify.return_value={**self.claims(),"nonce":"expected","hd":"other.invalid"}
        with override_settings(GOOGLE_ALLOWED_DOMAINS=["approved.invalid"]):
            with self.assertRaises(ValueError):exchange_and_verify("code",flow)
        self.assertEqual(verify.call_args.kwargs["audience"],"fixture-client")

    def test_callback_query_redacted_from_development_logs(self):
        import logging
        from .logging_filters import RedactOAuthQuery
        record=logging.LogRecord("django.server",20,"",0,'"%s" %s',("GET /api/auth/google/callback/?code=private-code&state=private-state HTTP/1.1",302),None)
        RedactOAuthQuery().filter(record)
        self.assertNotIn("private-code",record.getMessage())
        self.assertNotIn("private-state",record.getMessage())
        self.assertIn("[redacted]",record.getMessage())
