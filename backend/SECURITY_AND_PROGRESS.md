# Local administrator credential record

Updated: 29 October 2026 (Asia/Singapore).

## Login and storage
- Local admin: http://127.0.0.1:8000/admin/
- Username: localadmin.
- The generated initial password is in backend/.admin-credentials.txt. Do not copy it into tracked documentation.
- Django stores the account and a salted password hash in PostgreSQL tipped database (auth_user table); backend/db.sqlite3 is now an inactive migration backup. It does not store the account password as plaintext in the database.
- The initial credential handoff file contains the password in PLAINTEXT. Git ignore prevents accidental normal commits; it does not encrypt the file or stop someone with filesystem access from reading it.
- backend/.env contains the server secret and local settings. It is also plaintext and ignored by Git.
- The database, .env, credential file and virtual environment were checked as Git-ignored. Never force-add them.

## Security assessment and action
This is a local development setup, not a production-ready security assessment. The server is bound to 127.0.0.1 and is not intentionally exposed to the internet. The generated password is random and Django hashes it, but the handoff file remains readable to anyone who can access it. Chat history also contains the initial password because the owner requested it.

After first login, use Change password in Django admin, save the new password in a password manager, then remove the plaintext handoff file. That file will not update when the account password changes. Deleting the file does not delete or disable the account. Bootstrap preserves an existing localadmin account and does not reset its password.

Reset a forgotten password from the backend folder:

```powershell
.\.venv\Scripts\python.exe manage.py changepassword localadmin
```

This command prompts interactively; do not put a replacement password in command history or tracked source.

Admin uses Django sessions and CSRF protection. This local HTTP server has DEBUG=True. Do not expose it publicly. An internet deployment needs production configuration, HTTPS, restricted hosts, protected secrets, database access controls/backups, and further validation.

## Current implementation and verified state
- Django 5.2.18, DRF 3.18.3, JWT access/refresh with blacklist support installed.
- PostgreSQL 17 installed locally; tipped_app non-superuser app role and tipped database created. Migrations applied; existing SQLite records imported and 10 tests rerun against PostgreSQL. SQLite fallback removed. Local test role has CREATEDB; remove that privilege for production.
- Admin supports report CRUD and Django admin change history; API supports public approved report browse, own report creation/history and pending edits.
- 10 automated tests passed, including actual admin create/edit/delete and history, privacy/ownership, forbidden fields, JWT expiration, rotation and logout.
- Health endpoint and admin login returned successful HTTP responses.
- React at port 5173 still uses demo data; it is NOT connected to the Django database at port 8000.
- OSA campus permissions, complete domain audit, verified registration, claims, custody/release and frontend integration remain future stages.

For ongoing implementation, read this record and README.md before making changes. Keep implementation status and test evidence current; do not claim PostgreSQL, React integration or production deployment is complete.

## PostgreSQL migration — 29 October 2026
Active database: PostgreSQL 17, localhost:5432, database tipped. Existing admin credentials and password hash preserved. Local PostgreSQL secrets are plaintext in ignored .postgres-admin-password, .postgres.local.json and .env. The migration-backup.local.json fixture is sensitive and Git-ignored. SQLite remains only as an inactive backup. Never commit these files or use local role privileges as a production policy.

## Design and account readiness audit - 30 October 2026
See DESIGN_UX_POLICY_AUDIT.md for route/component inventory, observed desktop/mobile UI, workflow and privacy rules, React/Django contract gaps, and proposed Google/student identity acceptance gates. Audit only; no real account import or Google connection was implemented. React remains in demo mode. PostgreSQL migration remains complete; frontend integration and production deployment remain incomplete.


## Requested file organization - 30 October 2026
Renamed tipped-frontend to frontend, backend/config to backend/backend and backend/reports to backend/base. Added app URL module, explicit BaseConfig and ASGI entry point, plus root context guides. Preserved internal reports app label and existing PostgreSQL schema/admin URLs. Updated path references. No student/Google identity integration occurred.
Verification after reorganization: Django check passed; makemigrations --check --dry-run reports no changes; all 10 Django tests passed on PostgreSQL; React production build succeeded. Both local servers restarted from the new paths and HTTP checks passed.

Scope confirmation: STRUCT.pdf defines file organization only. TIPPED student/OSA lost-and-found behavior remains the intended product. Source scan found no product model, checkout, cart or pricing implementation in active React/Django source. See context/project-overview.md for the confirmed scope and remaining identity decisions.


## Real account slice - 30 October 2026
Registration and approved student login now use Django/PostgreSQL. New requests are inactive until manual eligibility approval; duplicate registration does not replace credentials. Browser auth uses CSRF, in-memory access tokens and HttpOnly rotating refresh cookies. No real student accounts were precreated. Demo login/storage is no longer used. OSA website login, Google/verification/reset email and full report mutation integration remain unavailable. Read backend/ACCOUNT_SECURITY.md (ACCOUNT_SECURITY.md from backend) for approval steps and remaining limitations.

Account validation: all 17 Django tests passed on PostgreSQL; migration check found no pending schema changes; frontend production build passed. Live login and registration screens were inspected, demo shortcuts hidden, and pending-admin-approval text confirmed. No actual student registrations were created by the agent. Public report submission is disabled until full workflow integration is implemented.
