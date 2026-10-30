import uuid
from django.conf import settings
from django.db import models

class Campus(models.Model):
    code = models.SlugField(unique=True)
    name = models.CharField(max_length=100)
    active = models.BooleanField(default=True)
    def __str__(self): return self.name

class Category(models.Model):
    name = models.CharField(max_length=80, unique=True)
    active = models.BooleanField(default=True)
    def __str__(self): return self.name

class ItemReport(models.Model):
    class Review(models.TextChoices):
        PENDING = "PENDING_REVIEW", "Pending review"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    report_type = models.CharField(max_length=5, choices=[("LOST", "Lost"), ("FOUND", "Found")])
    title = models.CharField(max_length=90)
    description = models.TextField(max_length=3000)
    campus = models.ForeignKey(Campus, on_delete=models.PROTECT)
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    location = models.CharField(max_length=200)
    item_date = models.DateField()
    review_status = models.CharField(max_length=20, choices=Review.choices, default=Review.PENDING, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["-created_at", "id"]
        constraints = [models.CheckConstraint(condition=models.Q(report_type__in=["LOST", "FOUND"]), name="valid_report_type"), models.CheckConstraint(condition=models.Q(review_status__in=["PENDING_REVIEW", "APPROVED", "REJECTED"]), name="valid_review_status")]
    def __str__(self): return self.title


class AccountProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="account_profile")
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    student_number = models.CharField(max_length=50)
    program = models.CharField(max_length=100)
    site = models.CharField(max_length=80)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.CheckConstraint(condition=models.Q(email=models.functions.Lower("email")), name="account_email_lowercase")]
    def __str__(self): return self.email


class GoogleIdentity(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="google_identity")
    subject = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
