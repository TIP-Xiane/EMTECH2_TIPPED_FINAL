from django.contrib import admin
from django.urls import path, include

urlpatterns = [path("admin/", admin.site.urls), path("", include("base.urls"))]
admin.site.site_header = "TIPPED Database Administration"
admin.site.site_title = "TIPPED Admin"
