from django.contrib import admin
from .models import Campus, Category, ItemReport
admin.site.register(Campus)
admin.site.register(Category)
@admin.register(ItemReport)
class ReportAdmin(admin.ModelAdmin):
    list_display = ["title", "report_type", "campus", "reporter", "review_status", "created_at"]
    list_filter = ["review_status", "report_type", "campus", "category"]
    search_fields = ["title", "description", "reporter__username"]
    readonly_fields = ["id", "created_at", "updated_at"]
    def has_module_permission(self, request): return request.user.is_superuser
    def has_view_permission(self, request, obj=None): return request.user.is_superuser
    def has_add_permission(self, request): return request.user.is_superuser
    def has_change_permission(self, request, obj=None): return request.user.is_superuser
    def has_delete_permission(self, request, obj=None): return request.user.is_superuser


from .models import AccountProfile
@admin.register(AccountProfile)
class AccountProfileAdmin(admin.ModelAdmin):
    list_display = ["email", "full_name", "site", "account_active", "created_at"]
    search_fields = ["email", "full_name", "student_number"]
    readonly_fields = ["user", "email", "created_at", "approval_user_link"]
    def account_active(self, obj): return obj.user.is_active
    account_active.boolean = True
    def has_module_permission(self, request): return request.user.is_superuser
    def has_view_permission(self, request, obj=None): return request.user.is_superuser
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return request.user.is_superuser
    def has_delete_permission(self, request, obj=None): return False

    def approval_user_link(self, obj):
        from django.urls import reverse
        from django.utils.html import format_html
        return format_html('<a href="{}">Review account and Active status</a>', reverse("admin:auth_user_change", args=[obj.user_id]))
    approval_user_link.short_description = "Administrator approval"


from .models import GoogleIdentity
@admin.register(GoogleIdentity)
class GoogleIdentityAdmin(admin.ModelAdmin):
    list_display=["user", "created_at"]
    readonly_fields=["user", "subject", "created_at"]
    def has_module_permission(self,request): return request.user.is_superuser
    def has_view_permission(self,request,obj=None): return request.user.is_superuser
    def has_add_permission(self,request): return False
    def has_change_permission(self,request,obj=None): return False
    def has_delete_permission(self,request,obj=None): return False
