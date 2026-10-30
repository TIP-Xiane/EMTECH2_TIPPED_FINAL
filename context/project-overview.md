# TIPPED project overview

Updated 30 October 2026.

Campus lost-and-found application with React/Vite/Tailwind frontend and Django REST Framework/PostgreSQL backend. The requested reference folder organization is now used: backend/backend for configuration, backend/base for Django application code, frontend for React and context for project guides.

Implemented: browser demo public/student/OSA screens and workflows; separate Django report API with JWT, ownership rules, admin CRUD, PostgreSQL and automated tests. React now uses real Django registration/login and basic report reads. New accounts need administrator approval; full reporting and OSA website actions are not connected yet. Historical Express implementation is retained in frontend/server; root static prototype remains reference material.

Pending: actual student-email/Google identity integration, verified eligibility, remaining React/Django workflow alignment, campus-site mapping, scoped staff workflows and private evidence storage. Never treat mock student/OSA identity as real authorization.

Read architecture-context.md first, then backend/DESIGN_UX_POLICY_AUDIT.md and backend/SECURITY_AND_PROGRESS.md. Keep changes incremental; verify routes, imports and tests. Exclude credentials, local backups, environments and generated dependencies from committed documentation/data. No production deployment is configured.

## Confirmed product scope

The user confirmed that STRUCT.pdf supplies the folder/file organization only. The output remains TIPPED: the existing student/visitor interface and OSA lost-and-found workspace. Preserve report submission, review, ownership claims, physical custody and release as separate workflows. Do not introduce products, prices, shopping carts, checkout, payments or store pages from the reference example.

The standard project locations are backend/backend (Django configuration), backend/base (Django domain app), frontend (existing React interface), and context (architecture/project guides). This directory reorganization does not itself connect the frontend to Django or implement Google sign-in.

Next implementation milestone: agree on identity eligibility and campus/site mapping, align the Django account/report contract, then connect a tested student report flow while preserving the current UI. Exact approved school email domains and Google Workspace eligibility remain unconfirmed; do not guess them or import actual student accounts into demo storage.

## Real account slice - 30 October 2026
Registration and approved student login now use Django/PostgreSQL. New requests are inactive until manual eligibility approval; duplicate registration does not replace credentials. Browser auth uses CSRF, in-memory access tokens and HttpOnly rotating refresh cookies. No real student accounts were precreated. Demo login/storage is no longer used. OSA website login, Google/verification/reset email and full report mutation integration remain unavailable. Read backend/ACCOUNT_SECURITY.md (ACCOUNT_SECURITY.md from backend) for approval steps and remaining limitations.

## Google integration and live account cleanup - 30 October 2026
Added Google OAuth state/nonce/PKCE and server-side google-auth validation, explicit account linking, pending Google profile completion and administrator approval. OAuth client credentials have NOT been supplied; Google remains disabled and real-provider verification is pending. Removed demo/dead account UI and global development notices without claiming unfinished OSA/report operations are implemented. See backend/GOOGLE_SIGN_IN_SETUP.md (GOOGLE_SIGN_IN_SETUP.md from backend).

Login design clarification: use a distinct TIPPED navy/gold split campus-introduction and account-form layout. Third-party login screenshots are interaction references only; do not reproduce their branding or product appearance. Authentication behavior and folder structure remain unchanged.
