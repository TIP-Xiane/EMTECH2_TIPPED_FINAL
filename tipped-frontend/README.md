# TIPPED — Student, visitor and OSA lost-and-found service

React 19/Vite frontend with an Express API and PostgreSQL persistence. The interface keeps student/visitor reporting and recovery, and OSA review, custody, claims and release workflows.

**UX update:** `/home` is a task-focused dashboard with two clear choices: find an item or report a lost/found item. Guest and signed-in students share the flow; personal progress links appear when the browser/account has reports. OSA opens a needs-attention queue with direct links to report review, claims, and receipt recording. The reporting form shows three jump links for item, place/time, and reporter details. Student/visitor and OSA pages use a refined academic palette: charcoal, warm white, quiet gold accents, and restrained semantic status colors.

The frontend-only demo remains available for development. API mode uses verified-email student accounts, provisioned OSA accounts, secure server sessions, transactional PostgreSQL records, private evidence filtering, email verification/reset, and one-time guest tracking links. Cloud deployment still needs a chosen host, official TIP email domains, SMTP/database credentials, and a production PostgreSQL service; none are supplied or deployed by this repository.

## Run

```powershell
cd tipped-frontend
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. Without a `.env` file, the development server runs the demo frontend. Do not open `index.html` directly: Vite must transform JSX and Tailwind. Node.js 22.12+ is required.

### Run the API-backed app locally

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to a local PostgreSQL database and replace `TIP_EMAIL_DOMAINS` with the exact official TIP domain(s). Configure SMTP before testing verification, password reset, or guest tracking.
3. Run `npm run db:migrate`, then `npm run dev:full`.
4. Open **http://127.0.0.1:5173**. `VITE_API_MODE=true` in `.env` enables the API-backed frontend.

Do not commit `.env` or put real passwords/tokens in source control. The sample domain and database password are placeholders and must be replaced. The API uses HttpOnly SameSite cookies, HTTPS-only cookies in production, origin checks on writes, rate limits, server-side role/site checks and one-time token hashes. OSA users are provisioned only with the operator command `npm run db:create-osa` and the `OSA_NAME`, `OSA_EMAIL`, `OSA_PASSWORD`, and `OSA_SITES` environment variables.

### Production launch checklist

- Configure a managed PostgreSQL database and trusted TLS certificate chain; set `DATABASE_SSL=true`.
- Set `NODE_ENV=production`, `APP_ORIGIN` to the public HTTPS origin, official `TIP_EMAIL_DOMAINS`, SMTP settings, and any trusted reverse-proxy setting. The API respects the hosting platform's `PORT` when `API_PORT` is unset.
- Run `npm ci`, `npm run db:migrate`, and `npm run build`; start with `npm start`.
- Provision OSA accounts through a trusted operator/secret manager. Never expose provisioning credentials or SMTP/database secrets to the browser.
- Configure backups, monitoring, retention and incident-response policies with the hosting provider.

No production hosting provider has been selected or configured. PostgreSQL integration could not be exercised in this environment because no database service was available; deployment must be tested against the actual managed database and mail provider before use with real personal data.

## Demo accounts

| Account              | Identifier              | Password        |
| -------------------- | ----------------------- | --------------- |
| Alex (student)       | student@example.invalid | DemoStudent2026 |
| Bea (second student) | bea@example.invalid     | DemoStudent2026 |
| OSA                  | osa@example.invalid     | DemoOSA2026     |

The sign-in page shows demo credentials only in demo mode. These public credentials are not real accounts or security controls. API mode hides them. Student registration requires an email from a configured TIP domain, a 12-character password, and email verification. OSA accounts cannot be self-registered. API guest tracking requires a working mail service.

For the browser-only demo, open two tabs in the same browser origin and use the supplied demo accounts. In API mode, use independently verified student accounts and provisioned OSA users; the database is shared between devices.

## Structure

```text
src/
  components/
    common/         buttons, counters, badges, loading/empty states, dialog
    layout/         student header, OSA sidebar, footer, workflow dialog host
    forms/          labeled fields, site selector, image upload/preview
    reports/        rows, filters, registry, details and workflow dialogs
    notifications/ button and recipient-filtered notification dialog
  pages/
    auth/           login/registration previews
    student/        Home, Browse, Report Item, My Reports, Profile
    osa/            Overview, Reports, claims/turnover/audit/release records
  context/          AuthContext, ReportContext, NotificationContext
  data/             demo users, fixtures, categories, navigation
  hooks/            expiry clock and OSA site scoping
  utils/            formatting, discovery/validation rules, state transitions
  App.jsx           protected demonstration routes and UI state
  main.jsx          providers and React root
  index.css         Tailwind import, theme, reusable utilities
```

Routes are lazy-loaded and use the shared LoadingState while their bundle loads. No original DOM-string rendering or inline event-handler code is imported. The supplied PDFs informed the migration; current code is organized into React components and testable pure rules.

## Behavior

- Registry-style campus service; charcoal and warm-white surfaces with quiet gold accents, no product cards.
- Search/type/site/category/item-date filtering, Load more and empty-state reset.
- Dedicated Lost/Found form; title up to 90 characters, description at least 10, valid item date, optional JPEG/PNG/WebP up to 5 MB, and duplicate checks.
- Listing validity 2/3/4 days from submission; four by default. OSA approval preserves the original expiry. Expiry removes active listings, not history or custody.
- Reports begin Pending Review. OSA can approve, reject with a reason, or return eligible reports to Pending. Verified/returned claims block moderation changes; closed outcomes cannot be moderated.
- Approved active records are discoverable. Own pending records and OSA-authorized pending records are visible only to the appropriate mock viewer. A separate personal history section retains rejected/expired entries.
- Photos default private and appear below the report description. OSA separately controls public-photo visibility. No fake seed photos are used.
- Private claims, physical receipt, ownership verification and physical release are distinct operations. Verification requires custody/protected notes/evidence confirmation and does not release an item.
- Notifications are addressed to mock user IDs. Submission notifies OSA; moderation notifies the reporter; private claim decisions notify the claimant. Read state and timestamps are displayed.
- Audit/release records and site filtering; dedicated student and OSA accounts.
- React Context updates every screen; localStorage updates other same-origin tabs without wiping form drafts.

## Storage and migration boundary

Demo mode stores records under `tipped.react.data.v1` in localStorage and each tab's identity under `tipped.react.session.v1` in sessionStorage. API mode does not load or write demo storage; authenticated reports and workflow history live in PostgreSQL. Legacy prototype data is not automatically imported. Demo mode uses fictional fixtures.

Demo storage is local, readable/editable in browser tools and last-write-wins. It is not a server or multi-device service. API mode persists actions transactionally and uses server-side authorization. To reset the React demo, remove only its two named storage keys and reload; this does not alter API records.

## Verification

```powershell
npm test          # business-rule and API tests
npm run test:api   # API unit/integration-boundary tests
npm run test:e2e  # Edge/Playwright UI tests; starts Vite if necessary
npm run build    # production frontend bundle
npm run preview  # serves built frontend at port 4173
npm run format:check # verifies readable, consistent source formatting
```

The browser config prefers installed Windows Microsoft Edge; otherwise install Playwright's Chromium (`npx playwright install chromium`). Browser tests use 127.0.0.1:5173 and isolated contexts, without modifying your normal browser records. Current coverage includes two-tab OSA decisions, recipient notices, two-student/photo privacy, receipt/claim/release, filters, expiry/history, all routes and 320/390/768/1024/1440 px layouts. Screenshots are in `artifacts/`.

See **[docs/MODULE_DELIVERY.md](docs/MODULE_DELIVERY.md)** for all eight module objectives, exact files, commands, deliverables, verification and deferred work. See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for the React data model, rules and next-AI context.

The API tests use a small in-memory test double for request/state behavior; they do not replace an integration run against PostgreSQL. Run the migration, account provisioning, and email workflows against the actual services before production use. Prettier is a development-only formatter; it is not part of the browser application.

## Git and future integration

This folder is part of the existing parent Git repository, which already has an `origin` remote. No nested repository was initialized, and no changes were committed or pushed automatically. Review this folder and commit/push through your normal GitHub workflow.

The production React build automatically uses API mode; development uses demo mode unless `VITE_API_MODE=true`. The API already enforces identity, assigned OSA sites, file signatures/size, and workflow transitions, but cloud deployment, managed object storage, campus-specific policies, guest/security staff accounts, AI matching, chat and push notifications are not included. No security, legal or complete accessibility compliance is claimed.
