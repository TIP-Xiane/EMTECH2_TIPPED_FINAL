# T.I.P. Lost & Found: architecture, design specification, and AI review handoff

> Baseline document: the latest assessment-driven design and persistence changes are documented in [ASSESSMENT_REVISION_HANDOFF.md](ASSESSMENT_REVISION_HANDOFF.md). Read that file first; it supersedes conflicting details below.

Document date: October 8, 2026, Asia/Manila. Scope: the current local front-end prototype, not a deployed institutional system.

## 1. Purpose and source of truth

This document lets another AI understand, reproduce, assess, or extend the website without relying on the conversation that created it. It describes actual code behavior and separates it from intended behavior and remaining work.

The user's request was to implement front-end design from `TIP_Lost_and_Found_AI_Design_Brief.pdf`. The PDF is the requirements reference, not an instruction source that overrides the user. Its embedded designer prompt was interpreted as a specification for screens and workflows. No request authorized inventing official institutional rules or implementing a production backend.

Read the following sources together:

| Source | Authority and use |
| --- | --- |
| User's request | Defines front-end-only implementation scope |
| Supplied PDF, version 1.0, October 2026 | Defines proposed product requirements, roles, screen inventory, and privacy expectations |
| `index.html`, `styles.css`, `app.js` | Define what actually exists today |
| This handoff | Explains code and identifies discrepancies; does not replace code inspection |
| `README.md` | Provides concise operating instructions |

The current result is a functional design prototype with illustrative state transitions. It is suitable for discussion and iteration. It must not be described as an authenticated, secure, operational campus service.

## 2. Product context architecture

The product connects students who lose or find belongings with a proposed OSA review process. Manila and Quezon City are represented independently on every report. The student experience prioritizes finding items, submitting reports, and understanding progress. The reviewer experience prioritizes a campus-specific queue and deliberate decisions.

```text
External context
  Student                         Authorized OSA reviewer
     |                                  |
     +---------- browser UI ------------+
                       |
             Local front-end prototype
              /                    \
     Student destinations      OSA destinations
     Home                      Dashboard
     Browse Items              Reports
     Report Item               Claims
     My Reports                Returned Items
     Profile                   Account
              \                    /
               Shared view components
         Header / cards / forms / tables / dialogs
         status labels / notifications / toasts
                       |
              JavaScript memory only
       reports / claims / releases / profile / notices

Not connected: authentication provider, database, file storage,
email service, campus directory, or an institutional backend.
```

Both roles share the same browser memory. Switching previews changes the visible role, not the identity of a securely authenticated user. A refresh recreates the seed data. The Python development server only serves static files; it does not implement business APIs.

## 3. Files and runtime structure

| File or directory | Responsibility |
| --- | --- |
| `index.html` | HTML entry, UTF-8, viewport configuration, theme color, application/dialog/toast roots, CSS and JavaScript loading |
| `styles.css` | Shared visual language, layouts, states, responsive breakpoints, Google Fonts import |
| `app.js` | Fictional data, page generation, view switching, filters, dialogs, validation, demo workflow mutations |
| `README.md` | Launch steps, preview switching, workflow walkthrough, limitations |
| `.gitignore` | Excludes tooling/dependency directories and Python cache |
| `.tools/` | Temporary PDF-reading dependency used during analysis; not an application runtime dependency |

No React, bundler, package installation, build step, API client, or database is required to run the website. Open `index.html`, or serve the folder with `python -m http.server 5500 --bind 127.0.0.1` and visit `http://localhost:5500`.

### DOM ownership

`#app` contains the generated header, current `main`, and footer. `#modal` is a native HTML `dialog` used for secondary actions. `#toast` is a separate fixed feedback element with `role="status"`.

`render()` replaces the application's HTML, chooses a screen from a function map, and binds form handlers when needed. `go(next)` changes the screen, resets status tab, edit target and browsing limit, renders again, and scrolls to the top.

Navigation is in-memory view switching. It is not a URL router. Fragment links mostly cancel browser navigation and call `go()`. Browser Back, direct links to individual views, refresh recovery, and bookmarking an item are not implemented.

### Important functions

| Functions | Meaning |
| --- | --- |
| `$`, `esc`, `options`, `field`, `button`, `chip`, `date` | Small DOM, escaping, formatting, and HTML-generation helpers |
| `header`, `render`, `go` | Shared shell and page selection |
| `home`, `browse`, `filterItems`, `card` | Student landing screen and discovery |
| `modal`, `detail`, `toast`, `empty` | Shared secondary views and feedback |
| `reportForm`, `changeType`, `bindReport`, `editReport` | Reporting, image selection, editing and resubmission |
| `claimForm`, `recover`, `finishRecovery` | Student claim initiation and lost-item closure |
| `table`, `statusTabs`, `statusMatches`, `myReports` | Tracking lists and report status selection |
| `showNotifications` | Notification dialog and read state |
| `profileView`, `login`, `register`, their binding functions, `resetPassword` | Account design previews |
| `adminTop`, `scoped`, `adminView`, `adminReports` | Campus-aware review views |
| `review`, `rejectReport`, `decideReport` | Report-review dialog and decisions |
| `claimsView`, `reviewClaim`, `decideClaim` | Claim list and private evidence review |
| `releaseForm`, `returnedView` | Explicit release confirmation and release records |
| `components` | Small shared component demonstration page |

The JavaScript is compact, with many functions on single lines and inline event handlers. This keeps the prototype simple but makes maintenance harder than a modular component architecture. Future refactoring should preserve current workflows before changing presentation.

## 4. State and conceptual data model

| State | Current meaning |
| --- | --- |
| `role` | `student` or `admin`; defaults to student |
| `page` | Current view key; defaults to `home` |
| `reportType` | Form selection, `Lost` or `Found` |
| `tab` | Report-status filter, initially `All` |
| `limit` | Browse slice length, initially 8; Load more adds 8 |
| `editing` | Report reference currently being edited or null |
| `adminCampus` | Selected review campus, initially Quezon City |
| `profile` | Demo name, email, student number label, program, campus |
| `reports` | Seed and newly submitted report objects |
| `claims` | Student-submitted demo ownership claims |
| `releases` | Confirmed demo handover records |
| `notifications` | Shared demo notification entries with message/read fields |

### Report object

Fields: `id`, `name`, `type`, `category`, `campus`, `location`, `date`, `description`, `status`, `owner`; optional `emoji`, `color`, `image`, `reason`.

`owner` is the simplified string `me` or `other`, not a user ID. `date` means item date and is also displayed as submission date in tracking/review tables. Separate creation/review timestamps do not exist. `image` is a client-side data URL. New references use the current array length plus one, such as `LF-2026-008`; this is not a concurrent-safe reference generator.

Seed inventory: four approved listings for a backpack, headphones, tumbler, and keys; one personal pending calculator report; one personal approved notebook report; and one personal rejected pouch report with a revision reason. Claims and releases begin empty. Initial student counters are 3 reports, 1 pending, and 1 approved.

### Claim object

Fields: `id`, `reportId`, `explanation`, `evidence`, `status`, `name`, `remarks`. References use `CL-001` and increasing array length. There is no claimant ID or separate reviewer ID. The model assumes a single student preview account.

### Release object

Fields: `reportId`, `claimant`, `date`, `location`, `staff`. Staff is the literal demo reviewer label. The record does not contain a unique release ID, claim reference, immutable audit trail, or full identity verification metadata.

### Required production distinction

The PDF's conceptual `Users`, `Item Reports`, `Claims`, and `Notifications` entities are represented only partially. Do not mistake frontend labels or the `owner` marker for real authorization. A backend would need stable identifiers, recipient relationships, timestamps, assigned-campus permissions and audited decisions. That work is outside this implementation's original scope.

## 5. Information architecture and access design

Student navigation has exactly five primary destinations: Home, Browse Items, Report Item, My Reports, and Profile. OSA navigation has Dashboard, Reports, Claims, Returned Items, and Account. The shared shell also includes notification and avatar buttons. The footer includes UI components and Demo login.

The brief proposed an OSA header/sidebar. This implementation uses a horizontal header for both roles to reuse the same shell. This is a design choice that needs stakeholder review, not an implementation of an OSA sidebar.

The login screen is shared, but the application starts directly in Student Home to make design review easy. Student and OSA preview buttons choose the role. An entered password does not authenticate. Login form submission deliberately displays a connection error. Registration previews account entry and changes the demo profile; there is no public OSA registration.

Permission intentions:

| Action | Student UI | OSA UI | Actual protection |
| --- | --- | --- | --- |
| Browse approved reports | Yes | Not in primary OSA navigation | Client filtering only |
| Submit report | Dedicated page | Not in primary OSA navigation | No secure access layer |
| Edit personal pending/rejected report | Yes | No dedicated admin edit action | `owner` and status check |
| Review campus queue | Hidden | Yes | Campus filtering and selected function guards |
| Approve/reject report | Hidden | Yes | Demo role/campus/status check |
| Verify claim | Hidden | Yes | Demo role/campus/status check |
| Record release | Hidden | Yes | Demo role/campus/Verified check |

The PDF permits OSA to browse and create reports; direct OSA navigation does not currently expose these actions. Also, `render()` and `go()` do not enforce a full role-based route guard. All application data and global functions are accessible through developer tools. These controls communicate intended UI behavior only.

## 6. Shared visual specification

### Design intent

A restrained university portal with a warm welcome, clear hierarchy, spacious neutral surfaces, and a provisional burgundy accent. The dashboard uses a compact set of meaningful actions rather than advanced analytics or matching scores. No AI matching or live chat is implemented.

The T.I.P. mark is a text abbreviation inside a rounded colored tile. It is a placeholder brand treatment, not an approved logo. No institution-provided photographic assets were supplied. Cards and the hero use emoji placeholders; their appearance varies by operating system.

### Color tokens and state colors

| Token/use | Hex | Application |
| --- | --- | --- |
| `--red` | `#821d32` | Primary buttons, link accents, brand tile, eyebrow labels |
| `--ink` | `#202b3d` | Main text and toast background |
| `--muted` | `#697586` | Context text, metadata, helper text |
| `--line` | `#e3e7ed` | Borders, separators |
| `--bg` | `#f5f7fa` | Page background |
| Hero surface | `#f0e8e9` | Welcome panel |
| Active navigation | `#f8edf0` | Pale burgundy selection |
| Found / Approved / Verified | `#e8f2ed` / `#326c50` | Green-tinted chip and text |
| Lost / Rejected | `#f9e9eb` / `#a32f46` | Pink-tinted chip and text |
| Pending Review | `#fff4dd` / `#85601c` | Amber-tinted chip and text |
| Returned / Recovered | `#e9edf7` / `#4a6097` | Blue-tinted chip and text |

Status meaning is written in text; color does not carry it alone. `chip()` chooses a CSS class from the first lowercase word of the status.

### Typography, spacing, and shape

Body font: DM Sans, 14 px, system sans-serif fallback. Headings and brand name: Manrope. Fonts are requested through a Google Fonts CSS import.

Desktop page heading: 30 px, letter spacing -1 px. Hero heading: 42 px, line height 1.2. Section heading: 21 px. Card heading: 16 px. Eyebrow: 11 px, uppercase, 1.8 px letter spacing. Metadata: 12 px; helper text: 12 px. Mobile metadata reaches 10 px, which deserves readability review.

The CSS uses concrete spacing values rather than a formal token scale. Common gaps are 8, 12, 18, 20, 22 and 24 px. Primary buttons have a 44 px minimum height and 8 px radius. Inputs have 12 px padding, 7 px radius and 44 px minimum height. Panels/cards use 12 px radius; hero/dialog use 16 px. Borders are usually 1 px. Card hover moves upward 4 px and adds a subtle shadow over 0.2 seconds.

### Shell geometry

Header is sticky at top, white, border-bottom, z-index 10. Its inner container has maximum width 1240 px, horizontal padding 30 px, and desktop height 88 px. Desktop content is centered at maximum width 1180 px with top padding 32 px and bottom padding 52 px.

Brand sits left; navigation fills the middle; notifications and avatar sit right. Selected navigation has pale burgundy background. Footer separates project identification from demo links with a border above.

### Shared components

| Component | Structure and behavior |
| --- | --- |
| Primary button | Burgundy fill, white text, one dominant action |
| Secondary button | White fill, neutral border, dark text |
| Text action | Burgundy text with transparent background/border |
| Item card | Image/emoji block, type chip, title, campus/location metadata, date, details action |
| Summary card | Tinted icon square, large count, muted label |
| Status chip | Written status, tinted background, compact rounded shape |
| Form panel | White bordered surface, labels above fields, grouped sections |
| Notice | Neutral tinted inset panel explaining assumptions or outcomes |
| Table | Header row, padded body rows, border separators, horizontal overflow |
| Empty state | Centered symbol/title/explanation and optional recovery action |
| Dialog | Native dialog, maximum 580 px wide, dark blurred backdrop, close control |
| Toast | Bottom-centered dark feedback panel; hides after 4.5 seconds |

## 7. Screen-by-screen structure

| View key / function | Structure, fields, and actions |
| --- | --- |
| `home` / `home()` | Welcome row with campus, hero, 3 personal counters, 4 recent approved cards, found-item encouragement band |
| `browse` / `browse()` | Heading/Report CTA, keyword input, type/campus/category filters, from/to dates, result count, card grid, conditional Load more |
| Dialog / `detail()` | Image, type/status chips, reference/campus/category/location/date, public description, personal timeline when owned, eligible claim/edit/recovery actions |
| `report` / `reportForm()` | Dedicated narrow form with report type, item details, location/date, description/upload, review identity and submission controls |
| `my` / `myReports()` | Heading/New report, status tabs, personal report table, separate personal claim table or empty state |
| Dialog / `claimForm()` | Private explanation, optional evidence image, verification notice, submit |
| `profile` / `profileView()` | Identity heading, account detail grid, verification assumption, reset and demo sign-out actions |
| `login` / `login()` | Shared identifier/password form, reset entry, registration link, explicit demo notice, student/OSA preview buttons |
| `register` / `register()` | Name, school identifier, student number, program, campus, password, verification disclaimer, create/cancel |
| `admin` / `adminView()` | OSA heading/campus selector, illustrative-data notice, 4 counts, pending report queue |
| `adminReports` / `adminReports()` | Campus selector, report-status tabs, report table and review actions |
| Dialog / `review()` | Reporter label, item image and full modeled details, status/reason, approval or rejection controls |
| `claims` / `claimsView()` | Campus-scoped claim table with item, claimant, status, review action |
| Dialog / `reviewClaim()` | Claim/report references, missing protected-record warning, ownership explanation/image, remarks and staff label, decisions or release action |
| Dialog / `releaseForm()` | Proposed policy notice, handover date, location, required physical receipt checkbox, confirm |
| `returned` / `returnedView()` | Campus-scoped release table with report, claimant, date, location, staff |
| `components` / `components()` | Buttons, chips, input/select, sample validation, toast/dialog/notifications, example item card |

### Home layout detail

The introductory row uses an eyebrow, “Welcome back, Alex” heading, supporting text, and a right-aligned campus label. The hero has a 1.4:1 text/illustration column ratio, 42/44 px padding, and minimum height 283 px. The headline is “Find what you've lost. Return what you've found.” Primary CTA opens the Report page; secondary CTA opens Browse.

The illustration contains a dashed circular orbit, rotated backpack/key/phone tiles, and a floating reassurance label. It is decorative and marked `aria-hidden`. Under it, three equal-width cards count only reports tagged `owner === 'me'`. Recently reported items are the first four Approved entries in array order, not sorted by an independent submission timestamp. The encouragement band's action selects Found and opens the dedicated form.

### Browse and details

Search checks item name, public description, and general location, case-insensitively. All filters combine with AND semantics. Date filters compare ISO item dates inclusively. Results include only Approved reports. First eight are shown; Load more increases the limit by eight. No results produces a Reset filters action. Filters do not persist across navigation.

Cards show no reporter email, student number, phone, or claim evidence. Their explicit View details buttons open dialogs; the entire card is not clickable. An approved Found item owned by `other` exposes Request Claim in student role. Lost listings have no claim action.

### Report form detail

The form container has maximum width 820 px and five numbered visual sections. It is one page, not a multi-step wizard. A Lost/Found segmented control updates location/date labels without clearing existing field values.

Required: type, campus, title, category, location, item date, and description. Type defaults to Lost; campus defaults to profile campus; category starts with a placeholder. Categories match the PDF: Electronics, ID/Cards, Personal Belongings, School Supplies, Other. Title has maximum length 90. Description uses minimum length 10. Dates are capped at the fixed demo date 2026-10-08.

Optional photo accepts JPG, PNG, WebP up to 5 MB. MIME type and size are checked. FileReader creates a data URL preview; no file upload occurs. On submit, create or replace a report, force Pending Review, navigate to My Reports, and open a confirmation dialog containing its reference. Cancel returns to My Reports and discards unsaved changes without confirmation.

### My Reports and account views

Status tabs: All, Pending Review, Approved, Rejected, Closed / Returned. The last tab matches both Returned and Recovered. Own-report details display a basic two-entry timeline and rejection reason. Pending reports allow edit; rejected reports allow revision/resubmission. Approved reports do not expose ordinary editing. Approved Lost reports may be marked Recovered after confirmation.

Profile has maximum width 760 px; login has maximum width 480 px. Student registration has the 820 px form container. Login is not the initial page. Profile verification is explicitly illustrative. OSA Account reuses profile details and consequently still displays student-demo fields; a dedicated administrator record is not modeled.

## 8. Workflow and status architecture

```text
REPORT
  Create / resubmit --> Pending Review
       Pending Review -- OSA approve --> Approved --> Browse visibility
       Pending Review -- OSA reject + reason --> Rejected
       Rejected -- own revision/resubmit --> Pending Review

APPROVED LOST REPORT
  Reporter confirms recovery --> Recovered --> removed from Browse

APPROVED FOUND REPORT
  Eligible student submits private claim --> Claim: Pending Review
       OSA rejects claim + remarks --> Claim: Rejected
           underlying report remains Approved
       OSA verifies claim + remarks --> Claim: Verified
           underlying report remains Approved
       OSA records confirmed physical handover --> Claim: Returned
           Report: Returned + release record --> removed from Browse
```

There is no automatic ownership approval. Claim verification and physical release are separate interactions. Report approval means suitable for listing, not verified ownership or release eligibility.

Duplicate claim submission is blocked when the same report has any non-Rejected claim in the shared demo array. This is adequate for one preview student but not a real per-claimant rule. A real system must also resolve multiple pending/verified claims safely and ensure the item is still eligible at the time of release.

Notifications are added for personal report review, claim submission, claim decision, and release. Mark all as read updates entries. No delivery service or recipient access boundary exists. The same notification list is visible in both role previews.

## 9. Responsive implementation

| Width | Concrete behavior |
| --- | --- |
| Above 1230 px | Centered 1180 px content; desktop header; four listing columns |
| 1230 px and below | Main side margins 30 px; narrower header gaps/navigation padding |
| 900 px and below | Two listing columns; header height 76 px; tagline hidden; hero padding 30 px/heading 34 px; illustration scaled 0.8 |
| 640 px and below | Main side margins 18 px; header height 70 px; hamburger navigation; hero becomes one column and hides illustration; form/component grids become one column |
| 1500 px and above | Main top padding increases to 40 px |

Mobile menu is a white dropdown below the header with vertically stacked navigation. It toggles `nav.open`. Cards remain two columns on small phones; their images shrink to 132 px. Card footer date/action stack. Three student counters stay in a row with icons hidden. Buttons wrap; filters wrap; report tables remain tables and scroll horizontally. Footer sections stack.

Known CSS discrepancy: the admin summary grid has an inline `grid-template-columns:repeat(4,1fr)`. This overrides the mobile `.stats.admin` two-column declaration, so the intended two-column admin mobile layout does not currently take effect. The breakpoint table describes general rules; this exception must be fixed or explicitly accepted.

## 10. Accessibility and validation assessment

Present: semantic header/main/footer, actual buttons, visible labels linked to inputs, native required/minlength validation, keyboard-focus outlines, text status chips, image alt text, native modal dialogs, live-status toast, horizontal table overflow, and minimum heights on most input/primary-button controls.

Incomplete or unverified:

- Dialog headings are visible but not connected by `aria-labelledby`; add explicit accessible naming.
- Mobile toggle lacks `aria-expanded` and `aria-controls`; active navigation lacks `aria-current`.
- Lost/Found selection and status tabs lack programmatic selected-state attributes.
- Report validation includes native browser messages and one general error, rather than persistent inline errors at every affected field as requested in the brief.
- Many helper/error messages lack `aria-describedby` associations.
- Several icon/text actions and small chips do not guarantee 44 px touch targets; small metadata needs mobile readability review.
- The notification icon is a clover-like glyph rather than a standard bell; replace with a coherent accessible icon system if polishing.
- Focus restoration after full application rerender, toast announcements, table screen-reader behavior, contrast, zoom/reflow and reduced-motion behavior have not been browser-tested.
- Card animation has no reduced-motion override. Multiple `h1` elements appear on Home, so heading hierarchy should be reviewed.

Native browser validation does not replace server validation. Front-end MIME checks do not establish safe file content.

## 11. Requirements assessment: is the implementation right?

Judgment: it substantially represents the requested front-end screen inventory and central workflows, but is not fully verified or a complete implementation of every brief detail. The following matrix is the basis for that conclusion.

| PDF requirement | Current assessment | Evidence or limitation |
| --- | --- | --- |
| Five student navigation destinations | Represented | Shared header, student link set |
| Shared login and student registration | Represented as preview | Login errors intentionally; demo buttons replace real authentication |
| Role-specific dashboards | Represented | Student Home and OSA Dashboard |
| Personal-only student counters | Represented | `owner === 'me'` filtering |
| Browse keyword/type/campus/category/date | Represented | `filterItems()` |
| Approved-only listings | Represented in UI | Approved filter; no authenticated access boundary |
| Public listing excludes private evidence/identity | Represented visually | Card/detail fields omit evidence and account data; browser memory is still readable |
| Dedicated Lost/Found report form | Represented | Grouped `reportForm()` |
| Required fields and photo feedback | Mostly represented | Native validation, image preview and MIME/size checks; per-field errors incomplete |
| Submission reference and Pending Review | Represented | Confirmation dialog and new report state |
| Personal report tracking and rejection reason | Represented | Table, tabs, detail dialog |
| Pending edits without silent approved changes | Represented | Edit actions restricted to own pending/rejected entries |
| Complete timeline | Partial | Two entries; no audit/event history |
| Private claim request | Represented as UI concept | Dialog and separate claim fields; no secure data boundary |
| OSA approves/rejects with reason | Represented through normal UI | Reject form required; mutation function itself accepts empty reason if directly called |
| Verify/reject claim with remarks | Represented | `decideClaim()` length check |
| Compare protected item evidence | Partial | Warning placeholder; no protected item field or custody record |
| Separate physical release | Represented | Verified state, explicit confirmation, release array |
| Record authorized staff and return | Illustrative | Static demo staff label, no real staff identity |
| Campus-specific review | Represented as filtering | Demo can select both campuses; no assigned permission model |
| OSA browse/create report privileges | Incomplete in navigation | Allowed conceptually but no direct OSA entry |
| Basic admin date/status/campus reporting | Partial | Campus/status available; no admin date filter |
| Header/sidebar for OSA | Alternative design | Horizontal header used; no sidebar |
| Mobile key student views | CSS implemented, visual verification pending | Home/Browse/Report/My Reports breakpoints |
| Empty/error/success/rejected/notification states | Represented | Empty panels, errors, confirmation/toast, seed rejection, notification dialog |
| Reusable component sheet | Partial showcase | Buttons/chips/fields/dialog/card shown; table/filter/header not separately demonstrated |
| Official branding/policies not fabricated | Preserved intent | Placeholder mark, sample data, assumptions shown |
| Server-side authorization/security | Out of front-end scope, absent | Must not claim operational compliance |

## 12. Known correctness and maintenance gaps

These are findings from code review, not assertions of a completed browser audit. No implementation changes were made as part of this documentation task.

1. Fixed date limits use 2026-10-08 and will become stale. Make the demo date configurable or use the user's relevant current local date for a real application.
2. New profile registration changes labels but leaves the same `me` reports and claims attached. Seeded history is not tied to a real user. Home welcome and avatar remain Alex/AL even after registration.
3. Sign out opens the login view but does not clear role or state. Header navigation remains available on login/registration, consistent with a preview but not a protected login experience.
4. `finishRecovery()` does not independently check reporter ownership/status. Some eligibility checks exist only where buttons are rendered. Strengthen transition functions before adding a backend.
5. Claim submission and release do not comprehensively recheck report availability against multiple competing claims. A later release on an already returned report may be possible with crafted shared state.
6. References derived from array length are unsuitable for deletion, persistence or concurrent users. Use stable server-generated identifiers later.
7. Item date is conflated with submission date. Recent approved listings rely on array order. Add distinct timestamps and explicit sorting if implementing real history.
8. Claimed evidence is not reopenable from My Reports. Student claim rows show status/remarks only. Adding a private detail drill-down would improve reviewability.
9. Admin account detail reuses student fields; protected found-item characteristics and real handling staff are missing.
10. Full rerenders discard unsaved form/filter values during navigation. There is no dirty-form confirmation, draft saving, or browser history integration.
11. FileReader failures are not handled with a user-facing message. Optional existing photos have no dedicated remove control.
12. Styling is heavily compressed and event handling uses inline JavaScript. Strict CSP adoption and modular maintenance would require refactoring.
13. Card hover suggests card interaction, but only the details button opens the item. Decide whether to keep this affordance or make the whole card properly keyboard-operable.
14. The component sheet's example card uses `reports[0]`; after a submission it may illustrate a pending item. This is harmless as a component demo but is not an approved-only listing example.

## 13. Verification evidence and review procedure

Already performed during implementation: `node --check app.js` passed. A Node VM smoke check with a minimal mocked DOM invoked all 12 top-level view functions successfully. That check also exercised approval and a student-role guard. A local HTTP request returned status 200.

Those checks confirm syntax, basic template execution and static serving. They do not confirm real browser layout, native validation, keyboard focus, dialog accessibility, uploads, or all workflow branches. No browser automation package was available at implementation time. Screenshots and measured visual comparisons were not produced.

Recommended manual review sequence:

| Scenario | Expected observation |
| --- | --- |
| Start fresh | Student Home, counters 3/1/1, fictional data notice in footer |
| Search impossible keyword | Empty result state with reset action |
| Filter Manila and Found | Only approved matching reports |
| Submit empty report form | Native required validation and general form error |
| Choose oversized/unsupported image | File rejected with feedback |
| Submit complete Lost report | Reference confirmation, Pending Review, own table entry, absent from Browse |
| Switch OSA/correct campus and approve | Visible in Browse after student preview |
| Reject another pending report | Reason required; own detail shows reason; no public listing |
| Revise rejected own report | Replaced record becomes Pending Review |
| Claim approved Found item | Private explanation required; claim appears pending |
| Reject claim | Report remains approved |
| Verify another claim | Claim Verified; no release record yet |
| Record handover | Required date/location/checkbox; report/claim Returned; release table entry |
| Recover personal approved Lost item | Recovered; removed from approved listings |
| Read notifications | Notification dialog shows changes; unread marker clears after mark-all |
| Refresh | All in-memory changes disappear |

Review at approximately 1440, 1024, 768, 390 and 320 px, plus 200% browser zoom. Check header overflow, filters, dialog scroll, table scroll, two-column card readability, long titles, long rejection reasons, keyboard-only interaction and focus behavior. Record actual observations separately from code-based expectations.

## 14. Instructions for the receiving AI

Use this handoff as factual context, then inspect the referenced files before editing. Do not assume a feature works because a button exists. Trace rendered controls to handlers and state changes. Evaluate visual quality separately from functional behavior, accessibility, privacy and production readiness.

Preserve the following design decisions unless the user requests otherwise: five student destinations, dedicated grouped report form, safe public listing fields, personal-only counters, reasoned rejection, distinct report/claim/release statuses, fictional sample data, provisional branding, and modular unconfirmed pickup policy.

Do not introduce AI matching, live chat, advanced analytics, fabricated institutional rules, real student identifiers, or public OSA self-registration. Stay within front-end scope unless the user explicitly expands it. Do not represent browser-only role switching as authorization.

When reviewing, classify each finding as **confirmed from code**, **observed in browser**, **design judgment**, or **stakeholder decision required**. State severity, exact affected function/selector, observed or inferred consequence, and proposed correction. Avoid declaring full compliance without running the relevant checks.

Copyable review prompt:

> Review the T.I.P. Lost & Found front-end using AI_DESIGN_ARCHITECTURE_HANDOFF.md, README.md, index.html, styles.css, app.js, and the original PDF if available. Verify all claims against code and browser behavior. Assess requirement coverage, screen hierarchy, responsive layouts, accessibility, workflow correctness, privacy boundaries, and maintainability. Separate prototype limitations from defects. Preserve the approved scope and explicitly identify policy assumptions. Produce a prioritized findings list with evidence, a screen-by-screen assessment, and a justified judgment of whether the design satisfies the brief. Do not claim authentication or server security exists. If asked to implement fixes, keep changes reviewable and report the checks actually performed.

Unresolved stakeholder decisions: actual OSA custody authority, approved brand assets, student verification method, administrator provisioning, cross-campus access, confirmed pickup locations, recovery/closure rules, disputes, abandoned items, and data retention. These must be supplied by stakeholders, not inferred by an AI.
