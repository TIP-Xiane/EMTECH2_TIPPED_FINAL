from django.utils import timezone
from rest_framework import serializers
from .models import Campus, Category, ItemReport
class CampusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campus
        fields = ["id", "code", "name"]
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]
class ReportSerializer(serializers.ModelSerializer):
    campus = serializers.PrimaryKeyRelatedField(queryset=Campus.objects.filter(active=True))
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.filter(active=True))
    class Meta:
        model = ItemReport
        fields = ["id", "report_type", "title", "description", "campus", "category", "location", "item_date", "review_status", "created_at", "updated_at"]
        read_only_fields = ["id", "review_status", "created_at", "updated_at"]
    def to_internal_value(self, data):
        allowed = set(self.fields) - set(self.Meta.read_only_fields)
        forbidden = set(data) - allowed
        if forbidden: raise serializers.ValidationError({key: "This field cannot be submitted." for key in forbidden})
        return super().to_internal_value(data)
    def validate_description(self, value):
        if len(value.strip()) < 10: raise serializers.ValidationError("Use at least 10 characters.")
        return value.strip()
    def validate_item_date(self, value):
        if value > timezone.localdate(): raise serializers.ValidationError("Date cannot be in the future.")
        return value
