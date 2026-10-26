# Phase 1 module delivery record

The user's eight-module message is the approved adaptation of the course outline. The original Fullstack-Course-Outline.pdf was confirmed to be in another conversation and was not locally inspected. MD and CJS.pdf and TIPPED_Final.pptx.pdf were read; existing runtime/test files were inspected. The latest handoff takes precedence over the presentation's conflicting proposed features.

Complete working implementations are saved in the exact files listed below; they are the deliverable code, not pseudocode. The original static project is preserved. Execute commands from `tipped-frontend`.

## Module 1 — project setup

Objective: establish React/JSX, Vite, Tailwind and version-controlled project structure.

Created: `package.json`, `package-lock.json`, `index.html`, `vite.config.js`, `.gitignore`, `src/main.jsx`, `src/App.jsx`, `src/index.css`.

Installation: `npm install` initially; use `npm ci` subsequently. Dependencies are pinned in the manifest and lockfile. Tailwind uses `@tailwindcss/vite` and `@import "tailwindcss"`. Existing parent Git was reused; origin already exists. No remote publication was performed.

Verification: initial `npm run build` passed after the environment allowed native build processes. Deliverable: a working React/Tailwind shell. Screen-specific functionality was intentionally deferred to subsequent modules.

## Module 2 — Tailwind visual foundation

Objective: preserve a campus-service visual language across student and OSA views.

Created: `src/components/layout/Navbar.jsx`, `OSASidebar.jsx`, `Footer.jsx`; `src/components/common/UI.jsx`, `StatusBadge.jsx`; `src/components/forms/CampusSelector.jsx`; `src/components/notifications/NotificationButton.jsx`; `src/data/constants.js`. Modified `src/App.jsx`, `src/index.css`.

Expected behavior: burgundy #821d32, ink #202b3d, muted #697586, line #e3e7ed, canvas #f5f7fa; DM Sans/Manrope with fallbacks; horizontal student header, OSA sidebar, mobile menu, minimal borders and restrained corners. Common controls have focus states and readable labels.

Verification: module production build passed. Deliverable: responsive application layouts. Global records and operational interactions were deferred.

## Module 3 — reusable components

Created: `src/components/common/ConfirmDialog.jsx`; `src/components/forms/FormField.jsx`; `src/components/reports/ReportRow.jsx`, `Registry.jsx`, `ReportDetailsDialog.jsx`; `src/utils/format.js`.

DashboardCounter, EmptyState and LoadingState are exported from `UI.jsx`; Navbar, OSASidebar, StatusBadge, CampusSelector and NotificationButton reuse the earlier foundation. ConfirmDialog uses React state and a ref/effect solely for the native dialog lifecycle, not HTML-string DOM rendering. Form controls associate their labels, helper messages and errors.

Verification: build passed; these components were then imported into Module 4 and exercised in the final UI tests. Deliverable: reusable components composed across pages. Operational claim submission was deferred to Module 6.

## Module 4 — Browse and filtering

Created: `src/pages/student/Browse.jsx`, `src/components/reports/ReportFilters.jsx`, `src/data/mockData.js`, `src/utils/reportRules.js`, `tests/rules.test.js`. Connected Browse/details in `src/App.jsx` for module verification.

Expected behavior: `.map()` registry rows; AND-combined keyword/type/site/category/item-date filters; eight-at-a-time Load more; resettable empty state; independent personal history. Twelve fixtures allow the pagination path to be exercised. Two student IDs distinguish own/private records. Images are optional.

Verification: production build and three initial Node rule tests passed. Deliverable: working discovery UI. At this stage fixtures were initially passed as props, then connected to Context in Module 5.

## Module 5 — Context state and domain rules

Created: `src/context/AuthContext.jsx`, `ReportContext.jsx`, `NotificationContext.jsx`; `src/utils/transitions.js`; `src/hooks/useClock.js`. Modified `src/main.jsx`, `tests/rules.test.js`.

AuthContext supplies the mock user/session; ReportContext owns records, selected OSA site and action boundary; NotificationContext derives recipient-specific messages/read state from the shared store. Pure `applyAction()` clones/validates records before committing a transition. localStorage is optional demonstration persistence and uses a separate React key. External updates replace record state while React preserves local form values.

Verification: five domain tests and the Context build passed. Deliverable: coherent reports/claims/custody/releases/notifications across views. No production authentication or server permissions were added.

## Module 6 — details, photos and private claims

Created: `src/components/forms/ImageUpload.jsx`; `src/components/reports/ClaimDialog.jsx`; `src/components/notifications/NotificationsDialog.jsx`. Updated `ReportDetailsDialog.jsx` and `App.jsx`.

Expected behavior: details show reference, type, category/site/location/date, moderation/custody/outcome, expiry, description, then image. Owner/reviewer may see restricted photos; another student requires explicit public-photo approval. Missing/private states are textual. Eligible other-owner Found reports expose Request Claim. Explanation requires at least 15 characters; evidence is optional; submission creates Pending Review, never automatic verification or return.

Verification: module build passed; final browser tests cover photo permissions between two students and the complete private-claim workflow. Deliverable: Context-backed detail/claim interfaces.

## Module 7 — Lost/Found form

Created: `src/pages/student/ReportItem.jsx`; modified route integration in `App.jsx`.

Expected behavior: one dedicated form with Lost/Found selection; grouped information; required title/category/site/location/item date/public description; optional image preview/removal; 2/3/4-day validity defaulting to four; reporter identity retrieved from Context. Title ≤90, description ≥10, no future item date, JPEG/PNG/WebP ≤5 MB and equivalent-duplicate prevention. Submission creates a reference/event/OSA notice and confirmation, then My Reports.

Verification: build passed; a real Edge smoke test verified empty-field errors and successful submission before advancing. Deliverable: functional reporting flow. Editing submitted records remains unavailable by design.

## Module 8 — final screens and UI testing

Created student pages: `src/pages/student/Home.jsx`, `MyReports.jsx`, `Profile.jsx`.

Created auth pages: `src/pages/auth/Login.jsx`, `Register.jsx`.

Created OSA pages: `src/pages/osa/Overview.jsx`, `Reports.jsx`, `Records.jsx` (composes separate claims/turnover/audit/release routes).

Created workflow components: `src/components/reports/ReportReviewDialog.jsx`, `ReceiptDialog.jsx`, `ClaimReviewDialog.jsx`, `ReleaseDialog.jsx`; `src/components/layout/WorkflowDialogs.jsx`; `src/hooks/useOSAScope.js`.

Created verification/configuration: `tests/frontend.spec.js`, `playwright.config.js`. Finalized `App.jsx` routes, lazy loading with LoadingState, role switching, toasts, dialogs and protected preview navigation. Improved image-label IDs in ImageUpload.

Expected behavior: every required student/OSA destination is navigable; all-site OSA default; direct Approve/Reject/Pending; required rejection/claim remarks; private evidence confirmation; receiving office/staff/time/notes; verified-claim release confirmation; recipient notifications and audit/release history. Recovered and Returned remain different outcomes. Invalid/closed/verified-claim moderation changes are blocked.

Verification: final results are recorded in `VERIFICATION.md`. Commands: `npm test`, `npm run test:e2e`, `npm run build`. Layouts exercised at 320, 390, 768, 1024 and 1440 px. Screenshot output: `artifacts/react-student-desktop.png`, `react-osa-desktop.png`, `react-osa-mobile.png`.

Deliverable: component-based frontend with an Express/PostgreSQL API baseline, verified-email student accounts, provisioned OSA accounts, guest tracking links, and server-enforced workflow rules. Deferred: production hosting/provider configuration, managed private object storage, formal institutional identity matching and pickup policies, guest/faculty/Security roles beyond visitor reporting, and complete accessibility/security audits. PostgreSQL integration and cloud deployment must be validated against the selected providers before real institutional use.

## Commands and review guidance

```powershell
npm ci
npm run dev
npm test
npm run test:e2e
npm run build
npm run preview
```

Review complete code in the saved files. For each later change, run the relevant domain/browser tests and update the architecture and verification documents. No Git commit/push was silently made; review the migration in the existing repository before publishing.
