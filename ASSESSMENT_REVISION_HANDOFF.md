# TIPPED assessment revisions — current implementation handoff

## Latest usability update

Account entry now includes **Open OSA account** and **Open Student account** buttons, plus a visible role switch in the header. These remain front-end previews, not secure institutional accounts. OSA defaults to **All sites** so Arlegui/Casal submissions are not hidden by the initial campus filter. Existing pending reports get an OSA notification when the reviewer enters, if none exists yet. Notifications are a labeled header button. Browse also includes a **Your submitted reports** section that retains status/history even after a listing expires or is rejected, independently from the active registry above it. OSA action rows stack on mobile so review controls remain visible. Asset version parameters refresh previously cached JavaScript/CSS.

OSA review tables now expose **Approve**, **Reject**, and **Pending** directly, alongside Review details. An OSA reviewer may move an existing pending/approved/rejected report among these moderation states; rejection always requires a reason. Decisions create student notifications. New report submissions create OSA notifications; notifications and read states are filtered by preview role. Opening an OSA notification selects its campus and opens review.

Student editing after submission has been removed. Browse immediately includes the reporter's own Pending Review entries, explicitly labeled, while other students see only approved listings. This preserves the assessment's moderation boundary. Photos remain hidden until reviewed.

Every new report selects **2, 3 or 4 days** of listing validity, defaulting to four, measured from submission. OSA approval does not extend that deadline. Expired listings leave Browse, but My Reports, OSA records, custody and claim/release history remain. Existing reports without expiry use creation date plus four days; old examples may therefore disappear. Open registry views recheck expiry once per minute. This implements a listing deadline, not automatic physical-item disposal.

These points supersede earlier editing, notification and listing descriptions below.

Updated October 8, 2026. This document supersedes the previous handoff wherever behavior differs. Sources: the supplied Comprehensive Critical System Assessment and Final Presentation (10 slides), interpreted within the user's front-end-only scope.

## Decision and applied changes

The assessment correctly distinguishes moderation, physical possession, ownership verification, and release. Its findings describe the presentation, not proof of vulnerabilities in a deployed application. The revised prototype applies the relevant corrections while keeping stakeholder policies provisional.

The shopping-style hero, oversized emoji product images and four-column item catalogue have been replaced with a campus-service dashboard, two task-oriented reporting actions and a compact registry of report references, item descriptions, locations and item dates. A process guide and OSA updates sit beside the registry on desktop. Mobile registry entries become stacked records. OSA has a separate sidebar workspace.

Proposed initial coverage is now **T.I.P. Manila: Arlegui and Casal**. Quezon City is deferred in this prototype, following the assessment's recommended pilot. This is not confirmation of official deployment scope. TIPPED branding is a text placeholder, without an official logo or assigned institutional domain.

## Files and execution

`index.html` loads the original `styles.css` and `app.js`, followed by `portal.css` and `portal.js`. The latter files override and extend the earlier prototype. They are now required application files. Keep script order intact. There is still no framework, build step or runtime server API.

`portal.js` captures selected original functions in `portalBase`, updates seed sites, restores demo storage, replaces rendering and workflow functions, and renders the new entry view. It preserves existing form/detail components where useful. This extension approach avoids a full rewrite, but a later refactor should consolidate the duplicate functions into modules.

## Demo sign-in and reviewer workflow

The default entry is login. Public preview credentials:

| Preview | Identifier | Password |
| --- | --- | --- |
| Student | student@example.invalid | DemoStudent2026 |
| OSA | osa@example.invalid | DemoOSA2026 |

These checks are convenience gates for design testing, **not secure authentication**. No real credentials should be entered. OSA self-registration remains unavailable. OSA can browse approved reports and create reports through sidebar destinations as well as review submissions.

For synchronization, open two tabs on **the same exact origin**, for example `http://localhost:5500` in both. Sign into Student in one tab and OSA in the other. Student creates a report. OSA selects the report's site and reviews it. Approve / accept changes moderation to Approved; Reject requires a reason of at least 10 characters. The student My Reports view and notification list update automatically. Accepted is the action wording; Approved is the stored moderation label.

## Persistence and tab synchronization

Shared records are JSON in localStorage key `tipped.portal.v2`. This includes reports, claims, release records, notifications, profile, custody receipts, audit events and a revision counter. Session role is in sessionStorage key `tipped.session.v2`, allowing student/OSA roles to differ between tabs.

Mutations call `persist()`. Another tab receives the browser storage event, restores the shared record snapshot, closes any open dialog and rerenders its view. Reload retains demo records. This is local browser synchronization only: it does not connect different computers, browser profiles, ports, protocols, or hostnames. `localhost` and `127.0.0.1` are different origins. Concurrent saves use last-write-wins snapshots, without server transactions. Storage failures are shown to the user; selected images may exceed browser quotas.

If an external update arrives while a report form is open, the form is rerendered and the user is told to re-enter unsaved values. Draft preservation is future work. For a clean demonstration, clear these two storage keys through browser developer tools and reload.

## Separate operational states

| Dimension | UI stages | Actor and rules |
| --- | --- | --- |
| Report moderation | Pending Review → Approved or Rejected; final closure | Student submits; OSA reviews; pending/rejected reports stay outside the registry |
| Physical custody | Awaiting Turnover → In Custody → Released | OSA preview records physical receipt; approval alone does not change custody |
| Claim | Pending Review → Verified or Rejected → Returned after release | Private explanation, reviewer remarks, distinct physical handover |
| Outcome | Open, Recovered, Returned | Lost recovery differs from found-item return |

Final report views use Closed for legacy Returned/Recovered status values, with outcome displayed separately. The original status aliases are retained internally where existing functions use them; this is not a relational production schema.

Receipt records contain item reference, receiving office, receiving staff, turnover time and protected item notes. A required checkbox confirms physical receipt. The finder receives a notification when a personal report's item is received. Staff/office text is demo input, not institutionally verified identity or an official pickup rule.

OSA claim review displays protected receipt notes separately from public listing content. Verification requires report approval, In Custody, a protected identifying note and remarks. A second verified claim on the same item is blocked. These checks illustrate a verification process; they cannot determine whether evidence is truthful or define official acceptable proof.

Release requires a Verified claim, Approved report and In Custody state. OSA confirms date, location and physical handover. Then the claim/item return outcome, custody Released and release log update together in the local snapshot. Rejecting a claim leaves report approval unchanged.

## Visibility, privacy and error handling

- Listing queries include Approved reports only; nonapproved details are restricted by preview role/ownership checks.
- Submitted photos default to private. OSA sees them during moderation and explicitly saves whether a reviewed photo may be publicly shown. There is no redaction editor; leave unsafe photos private.
- Public rows do not show student numbers, contact information, private evidence, protected receipt notes or internal review remarks.
- Audit records contain actor label, timestamp, reference, action and remarks. The log is local and editable, not tamper-resistant.
- Form fields now expose associated textual validation messages. Dates use a Manila local-date limit. Turnover time rejects future timestamps.
- Identical personal report submissions are blocked by item title, type, item date and location. This is a demo duplicate check, not a global deduplication service.
- Dialogs have accessible titles; active navigation has `aria-current`; the mobile menu exposes expanded state; reduced-motion preferences disable transitions.
- The OSA mobile count grid now overrides the original inline four-column style.

## Scope decisions and remaining work

Student and OSA roles are implemented as front-end previews. Faculty/Staff, secure guest tracking, separately authorized Campus Security, and system-administrator provisioning are not enabled. A future Security role must receive turnover-only permission independently of OSA moderation/release permissions. Guest access is deliberately not opened without a secure tracking mechanism.

No AI matching, model-based verification, live chat, email service, secure uploads, account verification, server authorization or database is present. A production implementation needs those applicable backend safeguards, a real data model, versioned transactions and noneditable audit storage. Formal privacy/legal/accessibility compliance is not asserted. Verification evidence rules, receiving offices, retention, disputes and official branding need stakeholder decisions.

The original long handoff remains a useful baseline, but its default-home entry, two-campus scope, catalogue layout and refresh-reset behavior are superseded here. The full actor and policy model described in the assessment remains a requirements task, not something browser-only controls can enforce.

## Verification

Browser tests in `tests/portal.spec.cjs` cover new student submission, OSA approval/rejection reflected across tabs, refresh persistence, physical receipt, private claim verification, separate handover/release, audit event creation, visible validation, empty results, student admin-route denial and mobile overflow checks. Tests run using Playwright and installed Microsoft Edge through `playwright.config.cjs`.

Generated screenshots are in `artifacts/`. They show student and OSA desktop/mobile layouts. These are fictional design-review artifacts. Passing these tests does not establish legal compliance, secure authentication or complete accessibility conformance.

## Receiving AI review instructions

Inspect `portal.js` and `portal.css` together with the original files; evaluating only `app.js` gives outdated behavior. Treat this document as descriptive context. Confirm workflow claims with real browser actions and inspect localStorage synchronization. Test multiple simultaneous claims, storage quota errors, dirty forms, long text, keyboard navigation and 320 px layouts before claiming complete coverage. Preserve separation of moderation/custody/claims, approved-only visibility, and explicitly provisional institutional policies.
