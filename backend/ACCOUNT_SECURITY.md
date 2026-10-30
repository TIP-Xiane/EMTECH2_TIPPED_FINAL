# Actual account registration and security

Updated 30 October 2026. Structure remains backend/backend (settings), backend/base (models, views, serializers, URLs, admin and tests), frontend (React), context (guides).

## User flow
Open http://127.0.0.1:5173/register and submit real account details and a unique TIPPED password (not a Google password). The server stores a real PostgreSQL User and AccountProfile. New users are inactive, nonstaff and nonsuperuser. Registration returns a generic accepted message for both a saved request and an already-registered email; this avoids exposing registration status publicly. Duplicate registration never resets the original password or creates a second profile. Email case is normalized and profile email has a database uniqueness constraint.

No sample student accounts were created in the live database by this implementation. Automated checks use isolated test databases and fictional identities.

## Administrator approval
1. Sign into http://127.0.0.1:8000/admin/ with your existing administrator account.
2. Open TIPPED records -> Account profiles and inspect the request.
3. Confirm eligibility through your institution's agreed procedure. A form submission does not prove email ownership or student enrollment.
4. Follow Review account and Active status to the linked User. Set Active only after approval. Leave Staff status and Superuser status OFF for a student.
5. Save. The approved student can sign in through the existing React login form with email + TIPPED password. Existing registered/approved users sign in; they do not need to register again.

School domains and the verification method are still unconfirmed, so registration does NOT claim institutional email verification. Email verification, Google OAuth, automated student approval, notification/reset mail, OSA website authentication and scoped staff assignment are not implemented. Do not grant staff privileges to work around that limitation. Administrators retain the separate Django panel. A new registration is an account request, not an automatically trusted student identity.

## Authentication/security contract
- GET /api/auth/csrf/: initialize CSRF cookie and token, no-store.
- POST /api/auth/register/: validated fields name/email/password/number/program/site; 202 generic accepted, 400 validation; 5 requests/hour per client through the development cache.
- POST /api/auth/login/: email/password; only active nonstaff AccountProfile users; generic 401 otherwise; 10 requests/minute.
- POST /api/auth/refresh/: CSRF-protected refresh cookie, active account check, refresh rotation/blacklist.
- POST /api/auth/signout/: revoke refresh cookie and clear it; remaining access token can live until its 5-minute expiry.
- GET /api/auth/account/: current registered student profile using the access token; no-store.
- Existing /api/auth/token/, /token/refresh/, /logout/ and /me/ remain lower-level API endpoints for compatibility and current automated tests. They do not constitute Google sign-in or public staff provisioning.

All browser auth writes have CSRF validation. Refresh cookies are HttpOnly, SameSite=Lax and scoped to /api/auth/; Secure is enabled outside local DEBUG mode. Access tokens are held only in module memory. React no longer restores identity from localStorage/sessionStorage or imports demo accounts for login. Reload restores authentication through the refresh cookie. The Vite /api proxy targets Django at port 8000 with relative same-origin browser requests. No wildcard CORS was added. In DEBUG mode, only the exact local frontend origin http://127.0.0.1:5173 is added to CSRF trusted origins for the Vite proxy. Production must configure CSRF_TRUSTED_ORIGINS explicitly.

Passwords use Django hashers and configured password validation (minimum 12, common/numeric/similarity checks). Passwords, tokens and student details must not be logged. Approval status is checked on login/refresh; JWT authentication also checks active user state. Unknown and server-privileged registration fields are rejected. Student profile/admin data is restricted to superusers in the profile admin. Django admin User editing is a powerful operator action, not a public role selector.

Local limitations: DEBUG=True, local HTTP, plaintext ignored environment/initial credential handoff files, development in-memory throttling cache, local database backups and no production mail/hosting. Before internet deployment use HTTPS, production settings, a shared durable cache/rate-limit strategy and operational review. This is not a complete security certification.

## Frontend capability boundary
Account registration/login/logout now use Django/PostgreSQL. Public and personal report reads use the existing basic Django report API, first paginated page only. Report photos, expiry, custody and claims are not inferred as completed workflows. The account slice disables report submission and rejects unsupported workflow mutations explicitly. No real data is written to demo storage. Existing local demo storage is not deleted or imported. Full reporting, pagination/filter mapping, notifications, OSA actions and private uploads remain a subsequent integration slice.

The existing interface is preserved, but demo account buttons are hidden, guest entry is public browsing only, and copy explains approval and missing mail capabilities. Actual Google accounts must not be entered as TIPPED passwords; Google sign-in will need its own reviewed OAuth setup later.

## Validation
PostgreSQL tests cover pending inactive creation, password hashing, case-normalized duplicate protection, privileged-field rejection, weak passwords, CSRF and hostile Origin rejection, approved account login, HttpOnly cookie, refresh rotation/logout, deactivation and denied student admin access. Existing report/admin tests remain part of the suite. See SECURITY_AND_PROGRESS.md for the final run result.
