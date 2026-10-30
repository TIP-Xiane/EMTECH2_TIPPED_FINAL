# React Phase 1 architecture and next-AI context

## Authority and conflicts

The latest user master prompt and approved eight-module sequence control this migration. MD and CJS.pdf describes the prior current behavior; TIPPED_Final.pptx.pdf describes the original concept. The original course PDF was unavailable locally, and the user explicitly approved using their supplied sequence. Preserve Student/OSA only, one optional image, burgundy registry design, locked submitted reports, distinct states, and 2–4-day discoverability. Do not substitute the presentation's guest accounts, multi-image requirement or conflated five-stage lifecycle.

## Layering

`main.jsx → BrowserRouter → AuthProvider → ReportProvider → NotificationProvider → App`.

Pages compose reusable components; Context supplies records/actions; `utils/reportRules.js` governs discovery/validation; `utils/transitions.js` governs immutable state changes. No original `innerHTML`, global function override or inline event-handler architecture is used. Native dialog showModal/close lives in a small ref effect; other UI state is React state. Route components load lazily with a shared loading fallback.

Demo mode keeps a demonstration profile per tab and stores reports in localStorage. API mode restores an HttpOnly-cookie session from Express, loads authorized state from PostgreSQL and submits actions to the server; it does not fall back to demo records. Notification Context uses only records returned for the current actor. OSA site scoping intersects the selected site with server-enforced assigned sites.

## Data shape

| Entity       | Main fields                                                                                                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User         | id, role, name, email, site (student), sites (OSA), number, program                                                                                                                |
| Report       | id, reporterId, title, type, category, site, location, itemDate, description, image, publicPhoto, moderation, custody, outcome, reason, createdAt, updatedAt, validDays, expiresAt |
| Claim        | id, reportId, claimantId, claimantName, explanation, evidence, status, remarks, createdAt, reviewedAt, reviewerId                                                                  |
| Receipt      | id, reportId, office, staff, at, note                                                                                                                                              |
| Release      | id, reportId, claimId, claimantId/name, date, location, staffId/name, recordedAt                                                                                                   |
| Notification | id, recipientId, reportId, message, at, read                                                                                                                                       |
| Audit event  | id, reportId, action, remarks, private, actorId/name, at                                                                                                                           |

The identity model improves on the old me/other string. Alex and Bea have separate demo histories and evidence visibility. API student registration creates a persistent account only after verification of a configured TIP email; OSA accounts are provisioned by an operator. Guest identities are session-scoped and secure tracking is delivered through a one-time email token.

## Actions

`applyAction(previous, {type,payload}, user, at?)` returns `{state,result}` or throws a textual error. Context writes the validated state to browser storage before making it current; a write failure leaves existing records unchanged. This is a frontend transaction boundary, not server security.

Supported actions: SUBMIT, MODERATE, PHOTO, RECEIVE, CLAIM, CLAIM_DECIDE, RELEASE, RECOVER, READ_NOTIFICATIONS.

Moderation: Pending Review ↔ Approved/Rejected for open reports, but blocked once any claim is Verified/Returned. Rejection needs a ten-character reason. No decision extends expiry.

Custody: Found report starts Awaiting Turnover. Explicit receiving office, staff, nonfuture time, protected notes and receipt confirmation set In Custody. Moderation remains unchanged.

Claims: a student may claim an approved, unexpired open Found report owned by another student. Explanation ≥15 characters; optional evidence. Own active duplicate claims and already verified items are blocked. Pending claims from multiple mock students can coexist until reviewed.

Verification: OSA/site permission, pending claim, Approved/open report, In Custody, protected receipt notes, remarks ≥10 and an explicit evidence comparison confirmation. A second verified claim is rejected. Rejecting a claim leaves listing approval unchanged.

Release: Verified claim + Approved/open report + In Custody + valid date/location + handover confirmation. Updates custody Released, outcome Returned and claim Returned, adds a release/audit record, and closes competing pending claims with notices. The report moderation stays Approved; final outcome is independent. Recovery instead sets Recovered only for the reporting student on an eligible Lost report.

## Visibility and expiry

Active registry: unexpired open reports that are Approved, plus the current reporter's Pending Review records or an assigned OSA reviewer's pending records. Rejected entries never enter active results. Personal history separately includes all own records and is deliberately independent of active search filters.

Public detail descriptions exclude personal identity, protected receipt notes and claim evidence. Photographs default private. Only owner or assigned OSA may see them until publicPhoto is explicitly enabled. Claim explanation/evidence is rendered only in appropriate OSA claim review; claimants see their own status/remarks. Private audit remarks are excluded from general report details.

validDays is 2/3/4, default 4. expiresAt is creation timestamp + days × 86,400,000. Expiry removes active discovery, not records, claims or custody. Approval never renews it. A minute clock updates open discovery screens. Equivalent submission checks intentionally preserve the previous rule: a nonrejected old equivalent report, even expired, blocks a duplicate.

## API persistence and authorization

`server/migrations/001_initial.sql` defines users, hashed sessions/tokens, reports, claims, custody receipts, releases, audit events, notifications and single-use guest tracking tokens. Report/workflow records are persisted as JSONB with indexed authorization/search columns. `state-store.js` loads a consistent state and applies shared pure transition rules inside serializable transactions, retrying serialization/deadlock failures. API responses filter records by actor/site and suppress private images, claimant evidence, reporter PII and private audit details where the actor is not authorized. The browser demo continues to use `tipped.react.data.v1` and `tipped.react.session.v1`; legacy `tipped.portal.v2` / `tipped.session.v2` are untouched and are not automatically imported.

The API requires same-origin write headers, rate limits authentication/actions, uses HttpOnly SameSite session cookies, bcrypt password hashes, hashed opaque email tokens and HTTPS-only production cookies. Password reset invalidates existing sessions. Guest tracking links are expiring and single-use. SMTP delivery is explicit; a failed guest tracking email is surfaced without discarding the already-saved report. Email tokens are never stored in plaintext. Student domains are configured rather than guessed.

Evidence images remain in the PostgreSQL JSONB payload in this initial backend, with server-checked size, MIME and file signatures. For a larger deployment, move evidence to private object storage with expiring authorized URLs and malware scanning. Configure database backups, audit retention, email delivery monitoring, and privacy/legal policies before real institutional use. No managed database, host or SMTP provider is included; PostgreSQL integration has not been run in this environment.

## UI and route map

Student/guest: `/home` offers two primary tasks (find or report), an optional recent-items section, and a report-progress link when there is activity. `/browse`, `/report`, `/my-reports`, and `/profile` remain available. The report form has jump links for item, place/time, and reporter details, followed by a review dialog. In API mode, guests receive an email tracking link. Auth routes are `/login`, `/register`, `/verify-email`, `/reset-password`, and `/guest-track`. OSA: `/osa` shows action counts and next steps for report review, claims, and found-item receipt; `/osa/reports`, `/osa/claims`, `/osa/turnover`, `/osa/audit`, `/osa/releases`, `/osa/registry`, `/osa/create`, `/osa/account` remain available. The sidebar keeps the first three workflows visible and groups secondary records/tools. Details, claims, receipts, decisions, release, and notifications use shared dialogs; OSA route access is checked both in the UI and on the API.

The student/guest, OSA, and sign-in surfaces use a shared institutional visual system: charcoal and warm-white foundations, quiet antique-gold highlights, muted gray dividers, and distinct restrained status colors. Pending work uses amber, completed workflow states use sage green, and rejections use muted red. Shared controls and surfaces use the same tokens; responsive navigation collapses to a menu on narrow screens. Demo mode remains a front-end simulation; API mode provides real authentication and persistence but still needs host/provider configuration and database integration testing before deployment.

## Remaining limitations

No hosting provider, official TIP domain(s), SMTP provider/credentials, object storage or institutional retention policy is configured. The PostgreSQL migration and API need integration testing against the intended managed database; backup restoration and concurrent operations should also be tested there. Browser-demo storage is readable/editable. Guest/security accounts, AI matching, chat and push notifications are not included. Formal WCAG/security/legal compliance is not asserted. Continue malformed-file, storage/concurrency, keyboard/screen-reader, operational and institutional-policy testing before using real personal data.

## Prompt for the next AI

Read this architecture, README.md and the React/Express/PostgreSQL source in tipped-frontend. Follow the user's newest request; preserve the approved campus-service design and separate moderation/custody/claim/outcome models. Do not edit the old root prototype unless explicitly requested. Enforce validation and authorization on the API, keep evidence private, and do not claim real cloud deployment without provider credentials and integration tests. Run npm test, appropriate Playwright checks, npm run build and npm audit; report verified behavior and remaining limitations. The eight-module sequence in the user's prompt is the approved course outline; do not block on the unavailable original course PDF.
