# Phase 1 verification

Verified October 15, 2026 (Asia/Manila), on Windows with Node 26.8.1 and installed Microsoft Edge. All testing applies to the React migration in `tipped-frontend`, not to the old root prototype.

| Check | Actual result |
| --- | --- |
| Module 1 initial production build | Passed |
| Module 2 Tailwind shell build | Passed |
| Modules 3/4 connected component/discovery build | Passed |
| Module 4 initial domain checks | 3 passed |
| Module 5 expanded transition checks and Context build | 5 passed; build passed after correcting listener syntax |
| Module 6 details/claims/notifications build | Passed |
| Module 7 report form browser smoke | Required-field feedback and valid submission passed |
| Final `npm test` | **8 tests passed** |
| Final `npm run test:e2e` | **6 tests passed** |
| Final `npm run build` | Passed; 65 modules transformed, lazy-loaded route bundles generated |
| Final `npm run format:check` | All matched files passed |
| Dependency installation audit | 0 vulnerabilities reported at installation; not a security certification |

## Domain checks

1. Verification and release stay separate; verified claims block moderation reversals.
2. Moderation requires appropriate OSA role; reasons are required and expiry is unchanged.
3. Search/filter combinations and other-student pending visibility.
4. Expiry removes discovery and photo access needs ownership/reviewer permission or public approval.
5. Equivalent-submission and invalid-validity rejection.
6. Unsupported/oversized image, future date, title length and description-length checks.
7. Missing custody blocks verification; rejecting a claim preserves report moderation.
8. Notification read state is recipient-specific; wrong-site reviewer access is rejected.

## Browser checks

1. Credential login, keyboard Escape dialog dismissal and registration without password persistence.
2. Two-tab student submission, OSA notifications, approval/rejection/pending decisions, student notices and reload persistence.
3. Separate Alex/Bea histories and private/public image behavior across OSA review.
4. Receipt details, private evidence review, verification without release, confirmed handover, student returned status and audit/release records.
5. Load more, combined filters, empty reset, validation, invalid-file feedback and expired personal history.
6. Every required route, role-route redirection, no uncaught page errors in the route sweep, and viewport overflow checks at 320/390/768/1024/1440 px. Screenshots were captured and visually reviewed.

## Evidence and limits

Browser tests use isolated contexts, preserving the user's ordinary browser data. Some fixture expiration is injected through localStorage to avoid waiting days. A synthetic tiny PNG verifies image visibility, not all image formats or malicious/corrupt file safety. Native form feedback, basic dialog keyboard operation and selected responsive layouts are covered; a full WCAG or assistive-technology audit was not performed.

The dev server is on 127.0.0.1:5173, reachable via localhost:5173. A static production build exists in `dist`; a production preview can be started with `npm run preview`. No deployment, backend connection, Git commit or GitHub push was performed.

Unresolved production concerns: real authentication, server permissions, evidence storage, audit immutability, concurrent saves, multiple devices, stakeholder policies and additional roles. These remain outside Phase 1.
