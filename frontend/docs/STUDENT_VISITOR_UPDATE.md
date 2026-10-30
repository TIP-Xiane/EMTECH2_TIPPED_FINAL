# Student and visitor experience

Updated October 26, 2026. The student/visitor PDF provided for this task informed the dark header, yellow actions, shared dashboard, reporter branches, location fields, and review step. Its descriptions of prototype defects were treated as observations, not desired behavior.

## Scope

- `/home` is the public entry point. Students and visitors can search or start a report without registering. Existing demo accounts remain available at `/login`.
- The dashboard focuses on two tasks: find an item or report a lost/found item. Search and report links are prominent, while the recent feed is limited to three approved, active reports. Personal progress appears only when there are reports to track.
- Student/visitor navigation uses a responsive menu on narrow screens. Core tasks remain visible; account access and sign-out stay separate. The OSA overview is an action queue for reports, ownership claims, and physical receipts. Its sidebar keeps these workflows visible and groups history/secondary tools into a disclosure.
- Report form navigation links to the three named sections: item details, place/time, and reporter details. Users can move between sections without losing entered fields, then review before submission.
- `/browse` searches item names, categories, campus, location, descriptions, and references. Main filters stay visible; optional date filters expand when needed. No-results feedback and reset controls replace blank results.
- `/report` uses three sections: item, location/date, and reporter. Campus changes clear dependent location values. Other / outside campus reveals a required place or address and an optional landmark, with no building/floor requirement. Other buildings reveal a required custom building/area and optional floor; listed buildings also offer Other / specify for unlisted floors. Both Lost and Found support these choices.
- TIP affiliates provide name, phone, email, school/faculty ID, and department. Visitors provide name, phone, email, and visiting purpose; organization is optional. The phone field retains 11 digits and explains callback use.
- Review shows the item, location/date/time, reporter contact, and photo before saving. Cancel preserves edits. A successful save creates one stable reference and displays a receipt.
- The existing single-image attachment remains unchanged: JPEG/PNG/WebP, up to 5 MB, private until OSA allows public display. Multiple attachments from the reference are outside this update.
- My Reports retains personal history, claims, OSA decisions, and reference numbers. Expired reports stay in personal history rather than cluttering public search.

## Workflow preservation

Student/visitor and OSA surfaces share a refined charcoal, warm-white, quiet-gold and neutral palette. Primary actions use charcoal or muted gold according to importance; pending and completed workflow states use restrained amber and sage indicators. Cards and secondary controls use subtle borders and consistent surfaces. The review controls and workflow features are preserved. Styles use `.public-portal` and `.osa-portal`. Student and visitor submissions use the existing SUBMIT transition and OSA notification, start Pending Review, and never assert physical custody. Receipt, verification, and release remain separate staff actions. Existing data keys and schemas continue to work; optional reporter details and event time are added to public submissions.

Other locations store `site: "Other"`, a required `siteDetail`, and a readable location string. The demo OSA account is assigned to Arlegui, Casal, and Other; existing saved demo sessions receive the updated assignment on reload. Other appears in site filters and its specified place is visible in review and report details. Outside-campus found reports ask the user to contact OSA for receiving-office guidance, without asserting that an outside item has been accepted into custody.

## Local prototype boundary

Account-free reports use a random browser-local reporter ID (`tipped.react.reporter.v1`) and existing local report storage. Reports survive reloads in the same browser/origin. My Reports filters by this ID or the selected demo account; changing a reporter-type radio does not expose other reporters' histories. Phone numbers and references do not authenticate users or retrieve reports on another device. No OTP, SMS, email, backend, or institutional identity verification was added. Local browser storage is inspectable and is not a secure server privacy boundary.

## Validation

- 9 domain tests passed, covering existing state transitions plus required outside-location details and assigned OSA review access.
- All 12 browser tests passed after the UX update. Coverage includes guest dashboard search, student and OSA sign-in, OSA action navigation, existing claim/custody workflows, public search, visitor and affiliate submissions, review cancellation, receipt/reference persistence, reporter separation, phone validation, location resets, outside-campus Lost/Found review, custom buildings/floors, shared OSA colors, and responsive layouts.
- Production build passed. Desktop and mobile screenshots are in `artifacts/public-*.png` and were visually reviewed.
- Changed source/test files are formatted with Prettier. The repository-wide formatting command still flags pre-existing formatting in untouched files.

Run with `npm ci` and `npm run dev`, then open `http://127.0.0.1:5173/home`.
