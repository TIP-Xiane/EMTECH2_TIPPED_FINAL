import secrets
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from base.models import Campus, Category

class Command(BaseCommand):
    help = "Create local admin and controlled lookup data; never reset existing credentials."
    def handle(self, *args, **options):
        if not settings.DEBUG: raise CommandError("Local bootstrap requires DEBUG=True.")
        for code, name in [("manila", "T.I.P. Manila"), ("quezon-city", "T.I.P. Quezon City")]:
            Campus.objects.get_or_create(code=code, defaults={"name": name})
        for name in ["Electronics", "ID/Cards", "Personal Belongings", "School Supplies", "Other"]:
            Category.objects.get_or_create(name=name)
        if not User.objects.filter(username="localadmin").exists():
            password = secrets.token_urlsafe(24)
            User.objects.create_superuser("localadmin", password=password)
            path = Path(settings.BASE_DIR) / ".admin-credentials.txt"
            path.write_text("Local development only\nURL: http://127.0.0.1:8000/admin/\nUsername: localadmin\nPassword: " + password + "\n", encoding="utf-8")
            self.stdout.write("Local admin created. Credentials saved to ignored .admin-credentials.txt")
        else: self.stdout.write("Existing localadmin preserved.")
