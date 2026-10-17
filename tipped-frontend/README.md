# TIPPED Phase 1 — React frontend

Complete frontend migration of the existing campus lost-and-found prototype. React 19, Vite 8, Tailwind 4, JSX, React Hooks, Context API and React Router. No backend, production authentication or database is implemented.

**October 17 update:** Open `/home` for the shared account-free dashboard, search, and lost/found reporting. Student and visitor forms include a review step, saved reference, and specified locations outside campus or in unlisted buildings. OSA uses the same black-and-yellow theme while preserving its review and custody workflows. See [STUDENT_VISITOR_UPDATE.md](docs/STUDENT_VISITOR_UPDATE.md) for the current flow, validation, and browser-local tracking limits. This supersedes the student sign-in requirement and student-screen descriptions below.

## Run

```powershell
cd "C:\Users\F-307\Downloads\PROJECT FOR EMPTECH\tipped-frontend"
npm ci
npm run dev
```

Open **http://localhost:5173**. The earlier static prototype remains at port 5500 if its Python server is running. Do not open the React index.html directly: Vite must transform JSX and Tailwind.

## Demo accounts

| Account | Identifier | Password |
| --- | --- | --- |
| Alex (student) | student@example.invalid | DemoStudent2026 |
| Bea (second student) | bea@example.invalid | DemoStudent2026 |
| OSA | osa@example.invalid | DemoOSA2026 |

Login also offers explicit preview buttons. These public credentials and role switches are demonstrations, not security controls. OSA accounts cannot be publicly registered. Registration creates a temporary student session with a distinct ID, discards the entered password and does not create permanent credentials.

For student/OSA updates, open two tabs in the **same browser on the exact same origin**, choose each role, and submit/review a report. localhost and 127.0.0.1 have separate storage. Private pending records are filtered by mock user ID; Bea is provided to check the privacy distinction.

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

- Registry-style campus service; burgundy and neutral palette, no product cards.
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

Records use `tipped.react.data.v1` in localStorage; each tab's session uses `tipped.react.session.v1` in sessionStorage. The old prototype's data remains untouched in its original keys. Existing legacy submissions are **not automatically imported** into the normalized React schema. Fresh, fictional fixtures are used.

Storage is local, readable/editable in browser tools and last-write-wins. It is not a server, shared institutional database or multi-device service. Saving failures show errors and do not commit the attempted in-memory transition. Refresh preserves data. To reset the React demo, remove only its two named storage keys and reload; this deletes the saved demo records.

## Verification

```powershell
npm test          # pure business-rule tests
npm run test:e2e  # Edge/Playwright UI tests; starts Vite if necessary
npm run build    # production frontend bundle
npm run preview  # serves built frontend at port 4173
npm run format:check # verifies readable, consistent source formatting
```

The browser config prefers installed Windows Microsoft Edge; otherwise install Playwright's Chromium (`npx playwright install chromium`). Browser tests use 127.0.0.1:5173 and isolated contexts, without modifying your normal browser records. Current coverage includes two-tab OSA decisions, recipient notices, two-student/photo privacy, receipt/claim/release, filters, expiry/history, all routes and 320/390/768/1024/1440 px layouts. Screenshots are in `artifacts/`.

See **[docs/MODULE_DELIVERY.md](docs/MODULE_DELIVERY.md)** for all eight module objectives, exact files, commands, deliverables, verification and deferred work. See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for the React data model, rules and next-AI context.

Latest validation: **8 domain tests and 6 browser tests passed**, production build passed, and formatting passed. See [docs/VERIFICATION.md](docs/VERIFICATION.md) for evidence and test limitations. Prettier is a development-only formatter; it is not part of the browser application.

## Git and future integration

This folder is part of the existing parent Git repository, which already has an `origin` remote. No nested repository was initialized, and no changes were committed or pushed automatically. Review this folder and commit/push through your normal GitHub workflow.

Later phases can replace Context's action boundary with Django REST Framework calls while retaining reusable screens. A server must revalidate identity, permissions, file safety and every state transition. PostgreSQL, Django, REST APIs, production login, guest/Security roles, AI matching, chat and official campus policies are outside Phase 1. No security, legal or complete accessibility compliance is claimed.
