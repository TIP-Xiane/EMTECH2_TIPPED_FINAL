# TIPPED design, UX and policy audit

Audit date: 30 October 2026, Asia/Singapore. Repository: `C:/Users/John Mclean Adornado/Downloads/CLONED/EMTECH2_TIPPED_FINAL`.

## Executive assessment

The React application already demonstrates a coherent campus lost-and-found service. Preserve the task-focused homepage, public report cards, guided reporting form, staff queues and separation of review/custody/claim/release. The main obstacle to real student accounts is not the appearance: it is the gap between the React/Express-era identity and data contracts and the new Django/PostgreSQL backend.

Do not enable real Google/student accounts by simply adding a Google button or changing the Vite proxy. Resolve identity, roles, campus/site mapping, privacy and API contracts first, then connect one tested flow.

This audit documents current implementation and recommendations. UI copy and demo rules are not evidence of approved institutional policy. No Google accounts were connected, student emails imported, report decisions submitted, or production permissions changed during this review.

## Evidence and limits

- Read current React routing, auth/report providers, request client, Vite proxy, CSS, common components, report rules, transitions, auth pages, reporting form, details/review dialogs, OSA records/dashboard, personal history and profile.
- Read the current Django report models and views and existing security/progress record.
- Live walkthrough: home, browse, report details, unsigned claim form, login, registration, My Reports, OSA dashboard/review/claims/turnover/releases/audit/registry/create/account.
- Used supplied fictional OSA demo access; signed it out after inspecting staff screens. Opened forms without submitting changes. Existing sample records supported observation; empty claims/releases screens were inspected as empty states, not as completed workflows.
- Visually inspected desktop home/login/OSA and 390x844 home/report form. Restored normal viewport afterward. This is a sample responsive review, not exhaustive device/browser/accessibility certification.
- Other states inspected in source: verification/reset/guest-link forms, claim decisions, release rules, notifications and profile. These are not all live end-to-end verified.
- Prior stage recorded 10 passing Django tests on PostgreSQL. That evidence is historical; this read-only design audit did not rerun or claim a full E2E regression suite.
- Older full documentation and backend blueprint were reviewed earlier in this chat. Current source takes precedence for implemented behavior. The blueprint proposes features and policy choices; it is not authorization or proof of implementation.

## 1. Current architecture and design layers

| Layer | Current purpose | Boundary |
|---|---|---|
| Root index.html/app.js/portal files | Earlier static prototype | Not the current Vite entry point |
| frontend/src | React 19, Router, Tailwind/Vite application | Browser currently uses demo state |
| src/context | Auth, records/actions, notification state | Demo identity/storage are not security controls |
| src/utils/reportRules.js and transitions.js | Discovery, eligibility and workflow behavior | Currently drives demo and older server logic; must be enforced in Django separately |
| frontend/server | Older Express/PostgreSQL API | Preserved legacy implementation; do not confuse with Django |
| backend | New Django/DRF/PostgreSQL service/admin | Basic authenticated report API, not full frontend integration |

App composition is BrowserRouter -> AuthProvider -> ReportProvider -> NotificationProvider -> lazy-loaded routes and shared dialogs. Site selection is shared state; hooks derive OSA-scoped queues. Suspense supplies a common loading screen.

## 2. Screen and navigation inventory

| Route | Screen / primary actions | Current UX and implementation note |
|---|---|---|
| /home | Find an item; Lost/Found report shortcuts; recent reports | Two task panels reduce the choice to search or report. Search opens browse with query. Desktop panels become stacked on mobile. |
| /browse | Public approved cards; search/type/site/category/date filters; reset; Load more | Client-side filtering and incremental display. Not yet Django server pagination. |
| Report detail dialog | Reference, review/custody/outcome, location, category, item date, expiry, description, photo | Uses a modal rather than a shareable detail URL. Claim and recovery actions appear conditionally. |
| /report?type=Lost or Found | About item -> place/time -> reporter details -> review -> receipt | These are section jump links in one form, not a wizard that advances one screen at a time. |
| /my-reports | Own reports by status; claim history; New report | Own means browser identity/demo account today. Empty states explain what to do next. |
| /profile | Identity, email, role, site, program/number, reset preview | Read-only profile; no actual Django student profile integration. |
| /login | Student/OSA selector, email/password, reset, guest entry, demo details | No Google sign-in. Student/OSA choice is presentation; future role authority must come from server. |
| /register | Name/email/number/program/site/password | Demo profile; password discarded. API-mode text anticipates email verification, but Django has no registration endpoint yet. |
| /verify-email | Token confirmation | Existing frontend expects legacy endpoint. Source-reviewed; not validated against Django. |
| /reset-password | Token and new password | Legacy flow; Django student reset is not implemented. |
| /guest-track | One-time private tracking link | Legacy flow; Django guest-link issuance/verification is not implemented. |
| /osa | Needs Attention tasks for review, claims, receipt | Operational counts and direct queue links, not decorative statistics. |
| /osa/reports | Search/filter; approve/reject/undo; report review | Rejection reason and transition rules in demo. Django OSA action endpoints absent. |
| /osa/claims | Private claim queue | Empty state observed; evidence/decision behavior reviewed in source. |
| /osa/turnover | Found items; record receipt; review custody | Actual receipt is intentionally separate from report approval. |
| /osa/releases | Completed handover records | Empty state observed. |
| /osa/audit | Actor/time/action history | Browser demonstration events, not immutable audit evidence. |
| /osa/registry | Staff browse | Link says Approved registry but pending reports also appear to scoped OSA. |
| /osa/create | Staff report form | Separate simpler five-section form; differs from public three-section form. |
| /osa/account | Reviewer identity/site assignments | Demo assignment, not Django campus permissions. |

Public navigation: Home, Find an item, Report an item, My Reports; notification and sign-in/profile/sign-out actions. Mobile has an expandable Menu with aria-expanded/aria-controls. OSA has a dedicated workspace header and sidebar: Needs Attention, Report Review, Ownership Claims; additional records/tools collapse under a details element.

## 3. Visual design system

Current rendered direction is a calm institutional palette. Base CSS still defines earlier burgundy/ink styles; later blocks override public, OSA and login surfaces. Do not infer the actual look from the first CSS definitions.

| Element | Observed/source styling | Purpose |
|---|---|---|
| Main header | Deep blue-charcoal #1d303b | Stable navigation and institutional tone |
| Canvas | Very light blue-gray #f3f6f7 | Separates white task/report panels |
| Body ink / muted | #253540 / #596873 in later theme | Heading/body hierarchy |
| Teal | #246e68 and related shades | Links and secondary operational accents |
| Gold | #f0be24 for key search/login actions; related muted gold marks | Brand accent and primary task emphasis |
| Lost / Found | Warm pale gold versus pale teal with text labels | Recognizable report-type distinction without relying only on color |
| Status | Labeled badges and distinct decision colors | Distinguishes review, custody, outcome and claim state |
| Typography | DM Sans body, Manrope headings, Google Fonts with sans-serif fallback | Clear hierarchy; third-party font loading should be included in privacy/dependency inventory |
| Surfaces | White panels, thin borders, restrained shadow, rounded corners | Separate tasks and records without a commerce-style interface |
| Layout | Max-width content, desktop grids and OSA sidebar; mobile stacked content | Keeps reading/form widths bounded |

Buttons generally use generous min-height, explicit variants, disabled treatment and focus outlines. Some dialog close controls are 38px and need target-size review. Form labels/hints and registry metadata are small: test zoom, contrast and low-vision use rather than assuming compliance.

Maintainability concern: index.css contains several successive theme/interaction overrides and multiple responsive breakpoints. Consolidate tokens and remove obsolete rules after behavior is stable; do not redesign the interface during identity integration.

## 4. Component inventory and responsibilities

| Area | Components / files | Responsibility |
|---|---|---|
| Foundation | common/UI.jsx | Button, PageHeading, counters/loading/empty-state presentation |
| Fields | forms/FormField.jsx | Generated label/input IDs, required marker, hints, aria-invalid and described-by errors |
| Modal | common/ConfirmDialog.jsx | Native dialog.showModal, labeled title, Escape/cancel, backdrop close, scrollable body |
| Status | common/StatusBadge.jsx | Reusable labeled workflow states |
| Upload | forms/ImageUpload.jsx | JPEG/PNG/WebP picker, <=5MB, preview, processing/errors; browser evidence only |
| Site selection | forms/CampusSelector.jsx, hooks/useOSAScope.js | Selected site and scoped operational data |
| Layout | PublicNavbar/WorkspaceNavbar/PublicFooter; OSASidebar; legacy Navbar/Footer | Public, auth and staff shells; some duplicated design paths remain |
| Results | PublicCards, Registry, ReportRow, ReportFilters | Public cards versus staff/history rows, filters and load more |
| Report details/review | ReportDetailsDialog, ReportReviewDialog | Public-safe detail display, own history, review/photo visibility controls |
| Workflow | ClaimDialog, ClaimReviewDialog, ReceiptDialog, ReleaseDialog | Private evidence, reviewer decisions, actual receipt and physical release |
| Orchestration | layout/WorkflowDialogs.jsx | Chooses the appropriate dialog and passes current report/actor actions |
| Notifications | NotificationButton, NotificationsDialog; NotificationContext | Unread count, inbox, queue/report navigation and read state |
| Identity | AuthContext, Login, Register, EmailActions, Profile | Current demo/legacy API identity presentation |
| Persistence | ReportContext, api/client.js | Browser storage/action boundary or legacy state/actions API |

Some screens still contain their own eligibility checks instead of sharing all predicates. Example: report details separately calculates claim eligibility. Keep backend rules authoritative and test UI affordances against them to avoid drift.

## 5. User journeys and exact current rules

### Discovery
Public browse prefilters Approved, then applies active/unexpired/outcome=Open rules. Search includes reference/title/category/site/location/description. Filters include Lost/Found, site, category and item-date range. PublicBrowse initially shows nine results; Load more increases local display, not database pagination. The generic staff Browse can additionally show own/scoped pending records, explaining the Approved registry mismatch.

### Reporting
Public form captures type, title (<=90), controlled category, public description (>=10), optional image, site, building/floor/area or outside-place details, item date and approximate time. Dates/times cannot be future in the form. Reporter details include name, 11-digit phone, email and either school/faculty ID + department (+optional year), or visitor purpose (+optional company). The form labels TIP email, but the public form itself only checks general email syntax, not institutional ownership.

Listing validity is 2/3/4 days, default 4, measured from submission. A review modal precedes the final submit. A saved receipt gives a TIP reference and Pending Review. Physical turnover is explicitly not confirmed by submission. Duplicate comparison is same actor/title/type/date/location, excluding rejected existing reports. These are demo rules, not all implemented in Django.

### Moderation, custody, claim and outcome

| Dimension/action | Current demo rule |
|---|---|
| New report | Pending Review; outcome Open; Found custody Awaiting Turnover |
| Moderation | Scoped OSA; open report; status must change; Rejected needs >=10-char reason |
| Reversal | Demo allows transitions among Pending/Approved/Rejected unless closed or verified/returned claim blocks change |
| Photo visibility | Scoped OSA separately approves public-photo flag; approval of report alone is not photo consent |
| Receipt | Open Found + Awaiting Turnover; office/staff/protected note >=10 chars, physical confirmation and valid nonfuture timestamp |
| Claim | Another reporter's approved, active Found item; student-role actor; >=15-char private explanation |
| Duplicate/competing claim | Blocks own nonrejected active claim or any already verified/returned claim; no automatic first-come approval |
| Claim verification | Pending claim; approved/open report; actual custody and protected receipt; explicit evidence confirmation; no competing verified claim |
| Claim decision | Verified/Rejected; reviewer remarks >=10 characters |
| Release | Verified claim + approved/open report + In Custody; confirmed actual handover, valid nonfuture date and location |
| Release result | Custody Released, outcome Returned, claim Returned; remaining pending competing claims rejected with notification |
| Lost recovery | Own approved/open Lost report can be marked Recovered |
| Expiry | Removes active public discovery; retains history; does not itself prove return or delete custody |
| Inbox reads | Only recipient/scoped staff inbox flags; reading does not approve, receive, verify or release |

These rules describe current transitions.js, not approved campus SOP. Approval undo, rejected resubmission, dispute escalation and retention must be explicitly decided rather than inherited accidentally.

## 6. Policy and data boundaries

| Data | Current intended audience | Integration requirement |
|---|---|---|
| General title/type/category/location/date/description | Public after approval | Avoid identity/ownership clues; moderation and backend serializer required |
| Reporter phone/email/student number/program | Owner and authorized operational staff as needed | Separate private profile/contact fields; no public serializer exposure |
| Photo | Private until OSA public-photo review | Real private storage, authorized download, content/dimension validation and metadata policy |
| Claim explanation/evidence | Claimant and scoped reviewers | Object permissions; never expose through public listing or another claimant |
| Protected receipt notes | Authorized receiving/review staff | Separate private custody record and logged access/change |
| Notifications | Recipient or scoped OSA work inbox | Server-scoped queries and safe notification content |
| Audit/admin history | Authorized staff/admin | Domain audit beyond Django admin edits; no secrets/full evidence in logs |

Browser demo privacy is a display rule, not data isolation: localStorage contains shared demonstration records and is readable/editable by the browser user. Do not put actual student contact details or evidence there. Same-origin tabs sync records; sessionStorage holds per-tab identity. localReporter persists an anonymous browser ID with a student role. That is why an unsigned visitor can see Request Claim.

No dedicated routed privacy notice, terms/retention screen, access-request or deletion workflow was found in the inspected route/component inventory. Existing warning copy acknowledges that official receiving offices, account provisioning and retention require stakeholder confirmation. This review does not establish legal compliance or institutional approval.

Open policy decisions: accepted student domains; current student eligibility; faculty/staff/guest capabilities; campus/site hierarchy; OSA versus receiving/security permissions; assigned office; proof of ownership/disputes; rejected report resubmission/editing; record/photo/audit retention; email channels; correction/deletion procedure; approved privacy notice and institutional ownership.

## 7. Important findings before real accounts

| Priority | Finding / evidence | Required direction |
|---|---|---|
| High | React Vite proxy points /api at port 3000; Django is 8000 | Replace legacy integration deliberately, not just URL configuration |
| High | React expects /auth/login(email,password,role), /auth/me -> {user}, /state, /actions | Django has /auth/token/(username,password), flat /auth/me/, resource routes and trailing slashes; implement an agreed adapter/contract |
| High | React user has role/name/sites/id; Django me only exposes id/username/is_staff | Add explicit student/profile and scoped operational-role model; is_staff is not an OSA assignment |
| High | Anonymous localReporter and demo guest are student-role actors | Decide guest reporting and require real authentication for student-only claims |
| High | API-mode guards send unauthenticated /home and /browse to login | Align with intentional public-browse policy; Django already permits public approved browsing |
| High | Frontend registration/resend/reset/guest-track target legacy endpoints | Django equivalents and account verification/abuse rules not implemented |
| High | React uses Arlegui/Casal/Other; Django lookups use Manila/Quezon City | Define Campus -> Site/Location hierarchy; do not map arbitrarily |
| High | Django only has review status/basic report fields | Add or explicitly defer validity/outcome/custody/photo/reporter-contact/time/reason/claims. Do not silently discard form data |
| High | Current Django uses built-in User; email uniqueness/verified identity/social identity absent | Decide email normalization, uniqueness, provider subject linkage and profile schema before accounts proliferate |
| Medium | Frontend request wrapper only uses body.error | DRF detail and field maps will collapse to generic messages; preserve status and normalize validation errors |
| Medium | OSA Approved registry includes pending report, observed live | Rename to Staff registry or restrict dataset; test intended semantics |
| Medium | Staff form says reports locked; Django allows owner edits while pending | Publish one editing policy and match the UI/backend |
| Medium | Public form success/aside and My Reports contain browser-demo text unconditionally | Update copy when real API mode is implemented; preserve accurate pending/email failure states |
| Medium | Login/register lack pending request state/disabled submit | Add duplicate-submit prevention and accessible status for network authentication |
| Medium | Registration collects student number/program and report repeats identity/contact | Minimize collection; prefill verified identity and separate callback contact from account identity |
| Medium | CSS accumulates multiple theme overrides and separate report form paths | Consolidate after integration, preserve visible style and component semantics |
| Review | Native dialogs/labels/errors/reduced-motion provide a good baseline | Verify keyboard focus return, full Tab path, contrast, zoom, mobile staff queues and screen reader interaction |
| Review | API production mode is automatically on for built frontend | A build alone is not a working Django integration; test deployment origin/proxy and identity recovery |

## 8. Accessibility and feedback assessment

Strengths in source: label associations, input hints/errors, aria-invalid, heading structure, native modal dialogs, role=alert/status feedback, visible focus styling, reduced-motion rules, descriptive photo text, mobile-menu expanded state and labeled workflow status.

Observed mobile home/report first screen stacked clearly at 390px. Further tests needed: all controls at 320px; keyboard menu/dialog opening and focus return; long report titles, addresses and translated text; 200%/400% zoom; contrast including muted metadata and disabled controls; validation summary links and focus after errors; OSA queue/action wrapping; distinguish server failure from empty results.

Long forms should preserve safe drafts after sign-in/session expiry. Fields auto-populated from a verified profile should identify what can be edited and should not imply the user can change verified identity by editing a report email. Report details currently have no stable detail route; consider a safe public deep link for return-after-login and report sharing.

## 9. Google and student-account design for the next stage

This section is a proposal, not implemented functionality.

Authentication answers who controls a Google identity. Eligibility decides whether that identity can use student capabilities. Authorization assigns what that local account can do. Student/OSA radio selection or a school-looking email is not sufficient for either institutional verification or staff permissions.

Proposed journey: public browse -> sign-in when a protected action is requested -> Continue with Google -> Django verifies the identity -> approved school-domain/eligibility rule -> minimal profile completion -> return to intended action. Do not lose the safe report draft. Show canceled sign-in, wrong-domain, disabled account, expired session, existing-account conflict and provider/network failure as distinct recoverable states.

Official Google guidance requires server-side verification of signature, audience, issuer and expiry, and checking the hosted-domain hd claim when restricting Google Workspace domains. Use the stable provider sub identifier for identity linkage. A browser hd hint or matching email suffix is not the backend check. Source: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

Email verification is not automatically proof of current student enrollment or OSA authority. Do not guess TIP domains, infer campus/program from email, or link accounts solely by untrusted email input. Define a verified existing-account linking procedure and enforce uniqueness transactionally. Google identity should default to no privileged staff role; OSA/receiver assignments remain controlled operations.

Request only identity scopes needed for login (openid/email and profile only if needed). Do not request Gmail/Drive/Contacts access to sign in. Google login and sending report-verification/notification email are different integrations: mail delivery still needs its own configured service. Never collect a user's Google password in TIPPED.

Before coding: confirm exact school domains and whether Google Workspace is used; decide personal Gmail versus school-only eligibility; choose Google Cloud project owner/consent audience; register local callback/origin and later HTTPS deployment values; choose one Django library/flow; define server session/JWT refresh storage, CSRF/state/nonce/replay protection and logout semantics. Do not mix Django admin session login with student role assignment. Secrets stay server-side; client ID may be public configuration. Official setup reference: https://developers.google.com/identity/openid-connect/openid-connect

Suggested schema: retain Django User initially unless a reviewed migration justifies replacing it; add StudentProfile/eligibility and explicit campus/site staff assignments; add SocialIdentity(provider, subject, user FK) with unique(provider,subject). Record verified email state and provenance separately. Confirm retention needs before storing extra Google profile attributes.

## 10. Recommended implementation and acceptance gates

1. Confirm identity and policy: school domains, guest permissions, campus/site hierarchy, account email uniqueness and staff provisioning. Record choices in an architecture decision document.
2. Build Django identity/profile contract: who-am-I response, verified Google identity, approved eligibility, no self-assigned staff roles, failure/duplicate/linking tests. No production accounts until the relevant privacy/storage controls are ready.
3. Adapt shared React client/AuthContext: same-origin proxy, error normalization, authentication persistence/refresh, pending states, public/private routing, intended-action return. Keep admin credentials separate.
4. Connect one full report slice: fetch controlled lookups, preserve required form data, server-assigned reporter, Pending Review persisted to PostgreSQL, own history and public-safe approved browse. Handle unsupported uploads explicitly until private storage exists.
5. Add scoped OSA decisions with reasons and audit, then independent custody, claims and release. Use transactions and database constraints for competing decisions and duplicate release.
6. Add mail delivery, expiry/outcomes, private upload storage, policy pages, retention/correction processes, deployment and full responsive/accessibility regression.

Acceptance tests before actual student use:
- School Google account accepted according to confirmed eligibility; unauthorized domains rejected; no account from forged/expired/wrong-audience/replayed provider response.
- New user cannot forge role/is_staff/sites/user IDs. Disabled users denied; linking existing account requires an explicit verified flow.
- Anonymous browsing works as intended; protected actions require the correct account; canceled login preserves safe draft and navigation intent.
- Student A cannot read/edit student B's private record/evidence; editing allowed only by the confirmed status policy.
- Student report appears in Django admin/PostgreSQL, remains after reload, starts pending, and appears publicly only after authorized approval.
- No contact/student number/private evidence in public JSON, cards, logs or notifications; photo policy is enforced on server downloads.
- Login/report requests show pending/error/success accurately and resist duplicate submits; DRF field errors map to fields.
- Campus/site filter does not grant permission; OSA scope verified by direct API requests.
- Verification is not custody/release; duplicate/concurrent release and competing verified claims prevented.
- No actual identity/evidence remains in demo localStorage or tracked documentation.

## Source map for follow-up

React: src/App.jsx; src/main.jsx; src/index.css; src/context/{AuthContext,ReportContext,NotificationContext}.jsx; src/api/client.js; vite.config.js; src/utils/{reportRules,transitions}.js; src/hooks/useOSAScope.js; src/data/constants.js; src/pages/auth/*; src/pages/student/*; src/pages/osa/*; src/components/{common,forms,layout,reports,notifications}/*.

Django: backend/backend/{settings,urls}.py; backend/base/{models,views,serializers,admin,tests}.py; backend/README.md; backend/SECURITY_AND_PROGRESS.md. Full legacy implementation is in frontend/server and should not be presented as Django functionality.

No application implementation changed in this audit. The next step is the identity/policy decision and contract slice, not immediate importing of real student emails.
