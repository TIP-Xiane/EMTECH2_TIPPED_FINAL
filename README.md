# T.I.P. Lost & Found — front-end prototype

**Current revision:** TIPPED uses a report registry and separate OSA workspace for the proposed Manila (Arlegui/Casal) pilot. Read [ASSESSMENT_REVISION_HANDOFF.md](ASSESSMENT_REVISION_HANDOFF.md) for the current design, status rules, limitations and AI handoff.

Open `http://localhost:5500` and sign in with the supplied **Student** or **OSA** demo credentials. To verify reviewer updates, use two tabs on that exact origin. Local browser storage now preserves records across reloads and synchronizes updates between tabs; the earlier refresh-reset description below is superseded. Demo login is not secure authentication.

Detailed architecture, visual specifications, screen inventory, requirement assessment and AI review instructions: [AI_DESIGN_ARCHITECTURE_HANDOFF.md](AI_DESIGN_ARCHITECTURE_HANDOFF.md).

Built from the supplied October 2026 design brief. Open **index.html** in a modern browser; no build or dependency installation is needed. Optional local server: `python -m http.server 5500`, then open `http://localhost:5500`.

The default screen is Student Home. Use **Demo login** in the footer to switch between Student and OSA previews. Screens include registration/login/reset, home, searchable listings and details, a dedicated report form, My Reports, private claims, profile, OSA dashboard/report review/claim review/release records, notifications, and a reusable component sheet. Responsive styles cover desktop and mobile.

## Try the workflows

1. Submit a student report. It begins Pending Review and appears only in My Reports.
2. Switch to OSA preview, select its campus, and approve it or reject it with a reason. Approved reports appear in Browse Items.
3. Return to Student preview and request a claim on another student's approved Found item.
4. Switch to OSA, select the matching campus, and review the private claim. Remarks are required for verification or rejection. Rejection leaves the report unchanged.
5. A verified claim permits a separate physical-release confirmation. Only then is the item marked Returned.

All data is fictional and held in memory. Refreshing resets the demo. Never enter real passwords, personal identifiers or ownership evidence. No authentication, institutional verification, secure storage, server authorization, email delivery or AI matching is implemented. Demo role switching is for design review only. Production requires server-side access checks and validation, secure password handling, and a confirmed account verification process.

Branding is provisional text, without an invented official logo. OSA custody, pickup, campus permissions, retention and dispute policies require stakeholder confirmation. Fonts load from Google Fonts when available and fall back to system sans-serif offline; the application itself needs no network access.
