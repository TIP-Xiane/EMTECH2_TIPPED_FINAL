# Current account status (30 October 2026)

Real registration and approved student login are connected to PostgreSQL. New accounts require administrator approval; no verification email or Google login is configured. See [ACCOUNT_SECURITY.md](ACCOUNT_SECURITY.md) for the current browser authentication contract and approval steps. Report submission and OSA website actions remain unavailable. The older stage-1 notes below describe the original API foundation; they do not override this status.

# TIPPED Django backend — stage 1

This is a separate Django/DRF backend. React at port 5173 still uses demo storage; the existing Express server is preserved. Records created in React do NOT appear in Django yet. Django API and admin share the same database.

## Local setup (PowerShell)
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
# Replace DJANGO_SECRET_KEY with a random secret before starting.
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py bootstrap_local
.\.venv\Scripts\python.exe manage.py test
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```
Open http://127.0.0.1:8000/admin/ . Local credentials are in ignored `.admin-credentials.txt`. Change the password through the admin password-change link. This account has full database administration access. Use fictional data.

## Database
PostgreSQL 17 is the active local database on 127.0.0.1:5432. DATABASE_URL in ignored .env is required; SQLite is no longer a fallback. Migrations and the automated suite were run against PostgreSQL.

The tipped database is owned by tipped_app, a dedicated non-superuser role. This LOCAL DEVELOPMENT role has CREATEDB so Django can create/destroy its isolated test_tipped database. Production app roles must not have CREATEDB; run tests with a separate test role/database.

Existing SQLite users (including password hashes), records and lookup rows were imported using a Django fixture with natural keys. db.sqlite3 is retained as an inactive backup. migration-backup.local.json contains sensitive database data and must not be committed. New changes go only to PostgreSQL; the old SQLite file is not kept in sync.

Local PostgreSQL administrator password: ignored .postgres-admin-password. App connection details: ignored .postgres.local.json and .env. These are plaintext local secrets, not encrypted. Restrict access and store production secrets in a secret manager. Do not share database passwords or expose port 5432 to the internet.

PostgreSQL runs as a Windows service. Start Django from this folder with `.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000`. Admin username/password are unchanged by the database migration.

## First API contract
All routes end with `/`. JSON, UUID report IDs, ISO dates, timezone-aware timestamps. Lists return `{count,next,previous,results}`, 20 records per page. JWT uses username/password initially; public registration and verified-email login are deferred.

| Method | Route | Access / behavior |
|---|---|---|
| GET | /api/health/ | Public service health, not a database readiness check |
| POST | /api/auth/token/ | username/password; access and refresh tokens; throttled |
| POST | /api/auth/token/refresh/ | refresh token; rotates and blacklists old refresh |
| POST | /api/auth/logout/ | refresh token; blacklists refresh; access expires within 5 minutes |
| GET | /api/auth/me/ | Current authenticated identity |
| GET | /api/campuses/, /api/categories/ | Active controlled lookups |
| GET | /api/reports/ | Public approved reports; search, campus_id, category_id, report_type, page |
| POST | /api/reports/ | Authenticated; creates own pending report |
| GET | /api/reports/mine/ | Authenticated; own records only |
| GET | /api/reports/{uuid}/ | Approved report or own private report |
| PATCH | /api/reports/{uuid}/ | Owner; pending records only |

Create body: `{"report_type":"LOST","title":"Black notebook","description":"A black notebook with lined pages","campus":1,"category":1,"location":"Library","item_date":"2026-10-29"}`. Fetch lookup IDs instead of assuming them. Server assigns reporter, UUID, timestamps and PENDING_REVIEW. Server-controlled and unknown fields are rejected. Public responses omit reporter identity. Never include ownership clues or personal identifiers in public descriptions.

Errors: 400 field-validation map; 401 invalid/missing JWT; 403 denied state/permission; 404 private/missing object; 405 unsupported method; 429 rate limit. Standard DRF `detail` errors. Normalized errors/OpenAPI are later work. Invalid state currently returns 403.

## Permission matrix
| Actor | Public browse | Create | Own pending edit | Others' private records | Admin CRUD |
|---|---|---|---|---|---|
| Anonymous | Yes | No | No | No | No |
| Active account | Yes | Yes | Yes | No | No |
| is_staff only | Yes | Yes | Own only | No | No report access |
| Superuser | Yes | Yes | Own only via API | Via admin | Yes |

Django admin login uses CSRF-protected sessions; API supports Bearer JWT and same-origin session authentication. API does not infer OSA authority from is_staff. Campus-scoped OSA and receiving-staff actions are deliberately not exposed yet. Superusers can administer reports and review_status in the local panel; this is not the validated OSA workflow. Django's admin LogEntry records panel additions, edits and deletions; API/domain audit is deferred.

JWT access lifetime 5 minutes, refresh 1 day, rotation/blacklist enabled. Logout cannot immediately revoke already-issued access tokens. No browser token storage has been implemented. No CORS wildcard is enabled. Same-origin integration and refresh-cookie/CSRF strategy must be designed before React integration.

## Model / ERD foundation
User 1 -- many ItemReport; Campus 1 -- many ItemReport; Category 1 -- many ItemReport. UUID report PK; reporter/campus/category protected foreign keys. Review states PENDING_REVIEW/APPROVED/REJECTED constrained in database; type LOST/FOUND constrained. Campus code and category name unique. Custody, claims and outcomes are not represented by review_status and will be added separately.

Existing React uses Arlegui/Casal/Other sites; new campus rows follow the proposed Manila/Quezon City scope. Mapping sites to campuses requires a deliberate integration change; no silent conversion occurred.

## Next tested stages
1. Confirm campus/site mapping, account eligibility and guest policy; complete data dictionary and OSA permission design.
2. Extend PostgreSQL concurrency coverage and add verified registration/authentication.
3. React API integration for browse/create/My Reports; preserve UI errors and session handling.
4. OSA review with campus assignments, decision reason, transactions and audit.
5. Claims, physical receipt and release with uniqueness/concurrency checks.
6. Private uploads, expiry/outcomes, notifications, production hardening.

Local runserver is not an internet deployment. Online admin needs a selected host, HTTPS, PostgreSQL, production secrets/settings and operational testing. DEBUG defaults false; production mode forces HTTPS and secure cookies. No deployment is claimed.
