from django.apps import AppConfig

class BaseConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "base"
    # Preserve migrated table names, ContentTypes, permissions and admin URLs.
    label = "reports"
    verbose_name = "TIPPED records"
