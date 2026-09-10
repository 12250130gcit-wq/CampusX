# CampusX · GCIT — Unified Portal

A front-end portal prototype that presents one shared login screen for three distinct account types: Student, SSO Admin, and Gatekeeper.

## Run locally

1. Open [index.html](index.html) directly in a browser, or
2. Serve the folder from the project root:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000/
```

## Project structure

```text
CampusX/
├── index.html                 → Unified login and registration screen
├── README.md                  → Project overview and quick start
├── assets/
│   ├── auth.js                → Shared session/auth logic
│   ├── store.js               → Shared localStorage data layer
│   ├── theme.css              → Shared brand/theme tokens
│   └── gcit-logo.png          → GCIT logo asset
├── student/
│   └── index.html             → Student portal
├── sso/
│   ├── index.html             → SSO Admin console
│   └── admin.css              → Admin styling
│   └── admin.js               → Admin logic
└── gatekeeper/
    ├── css/
    │   ├── style.css          → Gatekeeper app styling
    │   └── js/
    │       ├── main.js        → Gatekeeper shell/navigation
    │       ├── data.js        → Demo data + persistence
    │       ├── verification.js
    │       └── dashboard.js
```

## Demo accounts

| Role | ID | Password |
| --- | --- | --- |
| Student | STU-2024-014 | student123 |
| SSO Admin | ADM-SSO-001 | sso@admin123 |
| Gatekeeper | GK-001 | gate@2024 |

You can also register a new account from the main login screen. Those accounts are stored in the browser's localStorage so they remain available while using the same browser session.

## How the system works

- Each role has its own login flow and protected dashboard.
- The shared auth system checks the active session before allowing access to the app pages.
- The same browser storage is reused across the student, SSO, and gatekeeper experiences so demo data remains connected.
- Logout clears the session and sends the user back to the root login screen.

## Notes

This is a front-end prototype. It does not connect to a real backend or authentication service. All account and app data live in localStorage for demo and prototype purposes.
