from datetime import date
from django.contrib.auth.models import User
from django.test import TestCase, Client
from rest_framework.test import APIClient
from .models import Campus, Category, ItemReport

class ReportTests(TestCase):
    def setUp(self):
        self.a = User.objects.create_user("student-a", password="Testing-only-2026!")
        self.b = User.objects.create_user("student-b", password="Testing-only-2026!")
        self.site = Campus.objects.create(code="manila", name="Manila")
        self.category = Category.objects.create(name="Electronics")
        self.payload = dict(report_type="LOST", title="Black notebook", description="A black notebook with lined pages", campus=self.site.pk, category=self.category.pk, location="Library", item_date=str(date.today()))
        self.client = APIClient()
    def create(self):
        self.client.force_authenticate(self.a)
        response = self.client.post("/api/reports/", self.payload)
        self.assertEqual(response.status_code, 201)
        return response.data["id"]
    def test_creation_assigns_owner_and_pending(self):
        pk = self.create()
        report = ItemReport.objects.get(pk=pk)
        self.assertEqual(report.reporter, self.a)
        self.assertEqual(report.review_status, "PENDING_REVIEW")
    def test_anonymous_cannot_create(self):
        self.assertEqual(self.client.post("/api/reports/", self.payload).status_code, 401)
    def test_privileged_fields_rejected(self):
        self.client.force_authenticate(self.a)
        for key, value in [("reporter", self.b.pk), ("review_status", "APPROVED"), ("is_staff", True)]:
            self.assertEqual(self.client.post("/api/reports/", {**self.payload, key: value}).status_code, 400)
    def test_private_report_hidden_and_public_fields_safe(self):
        pk = self.create()
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get("/api/reports/").data["count"], 0)
        self.assertEqual(self.client.get(f"/api/reports/{pk}/").status_code, 404)
        ItemReport.objects.filter(pk=pk).update(review_status="APPROVED")
        public = self.client.get("/api/reports/").data
        self.assertEqual(public["count"], 1)
        self.assertNotIn("reporter", public["results"][0])
    def test_ownership_and_edit_state(self):
        pk = self.create()
        self.client.force_authenticate(self.b)
        self.assertEqual(self.client.get("/api/reports/mine/").data["count"], 0)
        self.assertEqual(self.client.patch(f"/api/reports/{pk}/", {"title": "Forged"}).status_code, 404)
        self.client.force_authenticate(self.a)
        self.assertEqual(self.client.get("/api/reports/mine/").data["count"], 1)
        self.assertEqual(self.client.patch(f"/api/reports/{pk}/", {"title": "Updated"}).status_code, 200)
        ItemReport.objects.filter(pk=pk).update(review_status="APPROVED")
        self.assertEqual(self.client.patch(f"/api/reports/{pk}/", {"title": "Updated again"}).status_code, 403)
    def test_bad_input_and_delete_denied(self):
        self.client.force_authenticate(self.a)
        self.assertEqual(self.client.post("/api/reports/", {**self.payload, "item_date": "2999-01-01"}).status_code, 400)
        self.assertEqual(self.client.post("/api/reports/", {**self.payload, "description": "short"}).status_code, 400)
        pk = self.create()
        self.assertEqual(self.client.delete(f"/api/reports/{pk}/").status_code, 405)
        self.assertEqual(self.client.get("/api/reports/?campus_id=invalid").status_code, 400)
    def test_jwt_login_refresh_logout(self):
        response = self.client.post("/api/auth/token/", {"username": "student-a", "password": "Testing-only-2026!"})
        self.assertEqual(response.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + response.data["access"])
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 200)
        refreshed = self.client.post("/api/auth/token/refresh/", {"refresh": response.data["refresh"]})
        self.assertEqual(refreshed.status_code, 200)
        self.assertEqual(self.client.post("/api/auth/token/refresh/", {"refresh": response.data["refresh"]}).status_code, 401)
        self.assertEqual(self.client.post("/api/auth/logout/", {"refresh": refreshed.data["refresh"]}).status_code, 200)
        self.assertEqual(self.client.post("/api/auth/token/refresh/", {"refresh": refreshed.data["refresh"]}).status_code, 401)
    def test_admin_access_and_crud(self):
        browser = Client()
        browser.force_login(self.a)
        self.assertEqual(browser.get("/admin/reports/itemreport/").status_code, 302)
        staff = User.objects.create_user("limited-staff", is_staff=True)
        browser.force_login(staff)
        self.assertEqual(browser.get("/admin/reports/itemreport/").status_code, 403)
        admin = User.objects.create_superuser("admin-test", password="Testing-only-2026!")
        browser.force_login(admin)
        self.assertEqual(browser.get("/admin/reports/itemreport/").status_code, 200)
        self.assertEqual(browser.get("/admin/reports/itemreport/add/").status_code, 200)
    def test_expired_or_invalid_token_denied(self):
        from rest_framework_simplejwt.tokens import AccessToken
        from datetime import timedelta
        token = AccessToken.for_user(self.a)
        token.set_exp(lifetime=timedelta(seconds=-1))
        for value in [str(token), "invalid"]:
            self.client.credentials(HTTP_AUTHORIZATION="Bearer " + value)
            self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)

    def test_admin_create_update_delete_and_history(self):
        from django.contrib.admin.models import LogEntry
        admin = User.objects.create_superuser("crud-admin", password="Testing-only-2026!")
        browser = Client()
        browser.force_login(admin)
        data = {**self.payload, "reporter": self.a.pk, "review_status": "PENDING_REVIEW", "_save": "Save"}
        self.assertEqual(browser.post("/admin/reports/itemreport/add/", data).status_code, 302)
        report = ItemReport.objects.get(title=self.payload["title"])
        url = f"/admin/reports/itemreport/{report.pk}/"
        self.assertEqual(browser.post(url + "change/", {**data, "title": "Admin edited title"}).status_code, 302)
        report.refresh_from_db()
        self.assertEqual(report.title, "Admin edited title")
        self.assertEqual(browser.post(url + "delete/", {"post": "yes"}).status_code, 302)
        self.assertFalse(ItemReport.objects.filter(pk=report.pk).exists())
        self.assertEqual(LogEntry.objects.filter(user=admin).count(), 3)
