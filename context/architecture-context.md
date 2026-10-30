# TIPPED architecture context

Updated 30 October 2026. Read together with project-overview.md.

```text
EMTECH2_TIPPED_FINAL/
|-- backend/
|   |-- manage.py
|   |-- requirements.txt
|   |-- backend/
|   |   |-- __init__.py
|   |   |-- settings.py
|   |   |-- urls.py
|   |   |-- asgi.py
|   |   `-- wsgi.py
|   |-- base/
|   |   |-- models.py
|   |   |-- serializers.py
|   |   |-- views.py
|   |   |-- urls.py
|   |   |-- admin.py
|   |   |-- apps.py
|   |   |-- tests.py
|   |   |-- migrations/
|   |   `-- management/commands/
|   |-- README.md
|   |-- SECURITY_AND_PROGRESS.md
|   `-- DESIGN_UX_POLICY_AUDIT.md
|-- frontend/
|   |-- package.json
|   |-- vite.config.js
|   |-- index.html
|   |-- src/
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |   |-- index.css
|   |   |-- api/
|   |   |-- components/
|   |   |-- context/
|   |   |-- data/
|   |   |-- hooks/
|   |   |-- pages/
|   |   `-- utils/
|   |-- tests/
|   `-- server/  (legacy Express reference, not Django)
|-- context/
|   |-- architecture-context.md
|   `-- project-overview.md
|-- docs/
|-- artifacts/
`-- tests/  (earlier static prototype tests)
```

This follows the supplied example's backend/backend, backend/base, frontend and context layout while retaining TIPPED's domain/components. No product/cart/order models were introduced. Existing root static prototype files and documents are retained as historical reference, not the Vite application entry point.

PostgreSQL is active via ignored backend/.env DATABASE_URL. SQLite file is an inactive backup. Secrets, migration backup and runtime dependencies are excluded from this tree. Do not infer active database from presence of db.sqlite3.

The physical Django app is base; BaseConfig.label remains reports to preserve existing migrations, database tables, content types, permissions and /admin/reports/ URLs. Do not change that label casually. Project configuration package is backend, not config. Run manage.py from the outer backend folder. Root URL config includes base.urls; API routes remain /api/... with trailing slashes.

React currently uses demo storage. Its optional legacy API mode still expects Express /state and /actions and proxies to port 3000. Django runs at 8000 and is not yet connected. Folder reorganization is not API integration. frontend npm dev:api/dev:full/start/db scripts still refer to the legacy Express implementation; use the Django commands below for the new backend.

Windows local commands:
```powershell
cd backend
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py test
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
# A separate terminal, starting at repository root:
cd frontend
npm run dev
```

Keep domain rules separate from UI, serialize public/private fields explicitly, assign ownership server-side and preserve current UI. Student email/Google login, OSA domain permissions, claims/custody/release and React integration remain future tested stages. Refer to backend/DESIGN_UX_POLICY_AUDIT.md and backend/README.md for detailed contracts/gaps.
