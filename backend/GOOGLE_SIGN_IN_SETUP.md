# Google sign-in setup and backend expectations

Updated 30 October 2026. The product remains TIPPED student/OSA lost and found. Folder organization remains backend/backend, backend/base, frontend and context.

## What exists now
PostgreSQL stores users, account profiles, report records and Google identity links. Django validates account input, hashes local passwords, denies inactive accounts, assigns ownership, scopes personal report reads and provides administrator CRUD. Browser authentication uses short-lived memory-only access tokens and rotating HttpOnly refresh cookies with CSRF protection. Existing students can deliberately link the same-email Google identity from their signed-in profile. Google email matching never automatically takes over an existing password account.

Google OAuth code flow is implemented with state, nonce, PKCE S256, ten-minute flow expiry, fixed Google token endpoint, HTTPS token exchange, timeouts and Google's official google-auth ID-token verifier. The verifier validates signature, audience, issuer and expiry; application checks verified email and nonce. Optional approved Workspace domains are checked against the verified hd claim. Domains are not guessed from a developer's commit email.

Google provider login does not grant OSA/admin privileges. New Google identities complete student profile fields, receive an unusable local password, and remain inactive pending administrator eligibility review. Verified control of a Google email does not establish current student enrollment. Public registration and Google registration cannot assign staff roles.

No Google access/refresh provider tokens are persisted; only the stable Google subject links to a local user. Application tokens are not placed in redirect URLs. Development server callback queries are redacted from Django request logs. Configure production proxy/application access logs to omit/redact callback queries too.

## Google Cloud configuration (owner action required)
1. Open https://console.cloud.google.com/ and create/select the project that should own TIPPED authentication.
2. In Google Auth Platform configure Branding and Audience. Choose Internal only if an eligible institution-managed Workspace project supports that audience. Otherwise configure the appropriate external/testing audience and add intended test users as required by Google. This does not create student accounts in TIPPED.
3. Create an OAuth client of type Web application. Authorized JavaScript origin for local development: http://127.0.0.1:5173.
4. Add this exact authorized redirect URI: http://127.0.0.1:5173/api/auth/google/callback/ . Do not add whitespace or change localhost/127.0.0.1 interchangeably. The Vite proxy forwards /api to Django.
5. Enter the credentials in backend/.env using your editor. Do not paste the client secret into chat, frontend source or tracked files:

```dotenv
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-server-side-client-secret
GOOGLE_REDIRECT_URI=http://127.0.0.1:5173/api/auth/google/callback/
GOOGLE_ALLOWED_DOMAINS=
```

Leave allowed domains empty until approved school Workspace domains are confirmed; this retains manual eligibility approval. For a school-only Workspace policy, list exact approved hd domains separated by commas. Do not use wildcards or infer enrollment from email suffix alone.

6. Restart Django. GET /api/auth/providers/ returns google_enabled=true only when the required configuration is present and the redirect URL is acceptable. This signal validates local configuration presence; it does not prove Google accepted the credentials. The Google button becomes usable automatically.
7. Complete a real sign-in in your own browser. Check account linking, canceled consent, wrong domain, unapproved student, approved returning student and logout/reload. A live provider round-trip is NOT verified until this step succeeds.

Use a separate HTTPS deployment redirect URI and approved origin for production. Set DEBUG=False, explicit ALLOWED_HOSTS and CSRF_TRUSTED_ORIGINS, secure cookies, protected database/secrets, durable shared throttling/session storage and appropriate logging. Localhost is not public hosting. The current callback selection rejects insecure remote HTTP URLs.

## Endpoints and files
- GET /api/auth/providers/: provider availability only, never secrets.
- POST /api/auth/google/start/: CSRF protected; creates state/nonce/PKCE in the server session and returns Google's authorization URL.
- POST /api/auth/google/link/: authenticated student and CSRF required; binds the target to the current local user.
- GET /api/auth/google/callback/: validates state/time, exchanges code, verifies token, then redirects to a fixed local login/profile-completion route. No arbitrary next URL accepted.
- GET/POST /api/auth/google/complete/: reads pending verified identity and submits required student details; cannot supply or alter the verified email/subject/role.
- backend/base/google_auth.py: OAuth and identity handling; models.py: GoogleIdentity; urls.py: routes; test_google.py: security checks.
- frontend/src/components/forms/GoogleSignIn.jsx: shared sign-in/link control; Login/Register/Profile pages use the existing design.

## What the legitimate app does not yet do
Account registration, approved password login and basic public/personal report reads are connected. Google flow is prepared but DISABLED until credentials are configured. Full report creation, private photos, proper campus/site mapping, expiry/outcomes, OSA website login/review, ownership claims, custody/release, notifications and mail/reset delivery remain incomplete. Removing demo wording does not implement these services. Unsupported submission stays disabled; administrator CRUD is separate from the eventual OSA workflow.

The login screen now offers student email/password, Google (availability controlled by server), public browsing and a separate administrator-panel link. Demo credentials, role self-selection, dead reset/verification forms, preview-loading copy and global development announcements were removed from the live account flow. Existing OSA visual components are retained for the next authorized workflow slice, not exposed through self-assigned roles.

## Next backend milestone
Connect report creation end to end with complete validated public/private fields, controlled campus/site lookups, private upload handling, persisted Pending Review and My Reports. Then add campus-scoped OSA approve/reject with reasons and audit. Claims, physical receipt and physical release follow as independently authorized transactional operations with concurrency/duplicate protection.

References: https://developers.google.com/identity/openid-connect/openid-connect and https://developers.google.com/identity/gsi/web/guides/verify-google-id-token . These describe the provider protocol; they do not certify the application or institutional eligibility policy.
