# React Phase 1 architecture and next-AI context

## Authority and conflicts

The latest user master prompt and approved eight-module sequence control this migration. MD and CJS.pdf describes the prior current behavior; TIPPED_Final.pptx.pdf describes the original concept. The original course PDF was unavailable locally, and the user explicitly approved using their supplied sequence. Preserve Student/OSA only, one optional image, burgundy registry design, locked submitted reports, distinct states, and 2–4-day discoverability. Do not substitute the presentation's guest accounts, multi-image requirement or conflated five-stage lifecycle.

## Layering

`main.jsx → BrowserRouter → AuthProvider → ReportProvider → NotificationProvider → App`.

Pages compose reusable components; Context supplies records/actions; `utils/reportRules.js` governs discovery/validation; `utils/transitions.js` governs immutable state changes. No original `innerHTML`, global function override or inline event-handler architecture is used. Native dialog showModal/close lives in a small ref effect; other UI state is React state. Route components load lazily with a shared loading fallback.

Auth holds a demonstration profile per tab. Record Context persists a normalized snapshot and listens for same-origin storage events. Notification Context derives only messages addressed to the current mock user. OSA site scoping intersects selected site with the user's assigned sites, both Arlegui and Casal for the supplied reviewer.

## Data shape

| Entity | Main fields |
| --- | --- |
| User | id, role, name, email, site (student), sites (OSA), number, program |
| Report | id, reporterId, title, type, category, site, location, itemDate, description, image, publicPhoto, moderation, custody, outcome, reason, createdAt, updatedAt, validDays, expiresAt |
| Claim | id, reportId, claimantId, claimantName, explanation, evidence, status, remarks, createdAt, reviewedAt, reviewerId |
| Receipt | id, reportId, office, staff, at, note |
| Release | id, reportId, claimId, claimantId/name, date, location, staffId/name, recordedAt |
| Notification | id, recipientId, reportId, message, at, read |
| Audit event | id, reportId, action, remarks, private, actorId/name, at |

The identity model improves on the old me/other string. Alex and Bea have separate histories and evidence visibility. Registration creates a session profile; no permanent password or institutional account is created. Sample passwords exist only in the explicit mock-data source.

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

## Persistence boundaries and future API integration

`tipped.react.data.v1` stores shared demo records; `tipped.react.session.v1` stores per-tab user. Legacy `tipped.portal.v2` / `tipped.session.v2` are untouched and are not automatically imported. Same-origin browser tabs synchronize; different computers/browsers/origins do not. Concurrent snapshots use last-write-wins; there is no locking or multiuser database. Large images can exceed quota.

For Phase 3, replace the Context action boundary with API calls and map returned server entities into the same normalized view model. The backend must repeat validation and permissions, issue stable IDs, enforce transitions transactionally, authorize private file access and use tamper-resistant audit storage. Do not add Django/PostgreSQL during Phase 1.

## UI and route map

Student: /home, /browse, /report, /my-reports, /profile. Auth: /login, /register. OSA: /osa, /osa/reports, /osa/claims, /osa/turnover, /osa/audit, /osa/releases, /osa/registry, /osa/create, /osa/account. Details, claims, receipts, decisions, release, notifications and reset use shared native dialogs. Route guards are demo UX only.

Tailwind theme: burgundy #821d32, ink #202b3d, muted #697586, border #e3e7ed, canvas #f5f7fa, DM Sans and Manrope fallbacks. Breakpoints are used where appropriate at 640, 760, 900, 1100 and 1230 px. Registry-style rows, little decorative shadow, three/four-pixel surface corners and accessible controls preserve the service identity.

## Remaining limitations

No backend, secure login, server roles, official student identity, multi-device updates, guest or Security accounts, AI matching, chat, email/push delivery, production file storage or institutional policies. Browser storage is readable/editable. Session profiles are not recoverable login accounts. Formal WCAG/security/legal compliance is not asserted. Test malformed files, storage quota/concurrency, more keyboard/screen-reader paths and production transition policy before expanding the scope.

## Prompt for the next AI

Read this architecture, MODULE_DELIVERY.md and the React source in tipped-frontend. Follow the user's newest request; preserve the approved campus-service design and separate moderation/custody/claim/outcome models. Do not edit the old root prototype unless explicitly requested. Use reusable functional React components, Tailwind, Context and pure rule helpers. Keep private evidence out of listing components. Do not claim server protection or real authentication. Apply targeted changes, run npm test and appropriate Playwright checks, verify npm run build, and report actual evidence plus remaining limitations. The eight-module sequence in the user's prompt is the approved course outline; do not block on the unavailable original course PDF.
