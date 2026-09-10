# CampusX · GCIT — Unified Portal

One login screen, three completely separate, interlinked accounts.

## How to run
Just open `index.html` in a browser (or serve the folder with any static
server, e.g. `python3 -m http.server`, then visit `/index.html`).

## Structure
```
index.html          → Unified login / register (role picker: Student, SSO Admin, Gatekeeper)
assets/theme.css     → Shared GCIT brand colors (sampled from the crest) used by all 3 apps
assets/auth.js       → Shared session system (localStorage-based, front-end only)
student/index.html   → Student portal (apply for leave, gate pass, profile)
sso/index.html       → SSO Admin console (leave approvals, students, reports, settings)
gatekeeper/*.html    → Gatekeeper app (scan/verify, visitors, movement logs, overdue, etc.)
```

## Demo accounts
| Role        | ID            | Password       |
|-------------|---------------|----------------|
| Student     | STU-2024-014  | student123     |
| SSO Admin   | ADM-SSO-001   | sso@admin123   |
| Gatekeeper  | GK-001        | gate@2024      |

You can also register a brand-new account for any of the three roles from
the login page — it's saved in the browser's localStorage so you can log
back in with it during the same session/browser.

## How the accounts stay separate but connected
- Every portal page calls `CXAuth.requireRole('...')` on load. If there's
  no session, or the session belongs to a different role, the visitor is
  bounced back to the root login page automatically.
- Logging out from any portal (Student, SSO Admin, or Gatekeeper) clears
  the shared session and returns to the single login screen.
- All three portals share the same color theme (`assets/theme.css`) and
  the same logo/brand assets, so they read as one connected product even
  though each account, dataset, and dashboard is fully separate.

## Notes
This is a front-end prototype — there's no real backend, so "accounts"
and app data both live in the browser's `localStorage`. Wiring this up to
a real authentication service and database is the natural next step.
