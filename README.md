# CampusX · GCIT Unified Portal

CampusX is a React + Vite front-end prototype for GCIT campus movement management. It provides one shared login and registration screen for three account types: Student, SSO Admin, and Gatekeeper.

## Run locally

Start PostgreSQL and the Go API with Docker Desktop running:

```bash
docker compose up --build
```

Install Node.js 22.12+ (Node.js 24 recommended). In a second terminal, start the React frontend from the project root:

```bash
npm install
npm run dev
```

Open the portal at:

```text
http://localhost:5173/
```

The API runs at `http://localhost:8080` and creates the PostgreSQL tables automatically on startup. The supplied GCIT student roster is imported during startup. The browser uses this API for leave history, new applications, decisions, student lookup, and gate movement history; localStorage remains an offline fallback when the API is unavailable.

## Project structure

```text
CampusX/
  src/
    App.jsx          React routes, role guards, and portal styles
    main.jsx         Single React entry point
    pages/           All 18 screens as React JSX components
    components/      Shared React layouts, forms, tables, dialogs, camera
    hooks/           Reactive data subscriptions
    services/        JavaScript authentication, storage, API, and roster utilities
    styles/          Shared and portal-specific CSS
  assets/            Theme and logo
  public/assets/     Static production assets
  backend/           Go API and PostgreSQL schema
  tests/             Playwright browser checks
  index.html         The single HTML bootstrap required by Vite
  vite.config.js     React build and API proxy
  docker-compose.yml PostgreSQL and API services
```

Every screen is implemented in JSX with React state, props, effects, and event handlers. Tables, dialogs, search results, navigation, and forms are rendered by React. The previous DOM controllers and separate HTML page files have been removed.

The app retains original URLs such as `/student/index.html`, `/sso/index.html`, and `/gatekeeper/verification.html` for compatibility; these are now client-side routes, not HTML files. Navigation uses browser history without reloading the document. The Go backend and shared JavaScript data utilities remain separate from the React UI.

## Build and test

```bash
npm run build
npm run preview
```

The deployable output is `dist/`. Vite development and preview servers run on port 5173 and proxy `/api` to `http://localhost:8080`. For deployment, configure the host to serve `index.html` for frontend routes and proxy `/api` to the Go API, or set `VITE_API_URL` before building (and configure the API's allowed frontend origin if using another origin).

```bash
npx playwright install chromium
npm test
npm run test:production
```

Browser checks cover every protected page, login/logout, registration, unauthorized redirects, React navigation and browser Back, visitor registration/checkout, event settings, gate exit/return persistence, and the student-to-SSO-to-gatekeeper leave workflow. They use the localStorage fallback, so PostgreSQL is not required for these checks. Hardware camera behavior and live database integration require separate checks with those services available.

On PowerShell installations that block `npm.ps1`, use `npm.cmd` and `npx.cmd` for these commands.

## Demo accounts

| Role | ID | Password |
| --- | --- | --- |
| Student | STU-2024-014 | student123 |
| SSO Admin | ADM-SSO-001 | sso@admin123 |
| Gatekeeper | GK-001 | gate@2024 |

Student accounts must use the college format ending in `gcit@rub.edu.bt`, for example `12250129gcit@rub.edu.bt`. The portal rejects student registration and login for any other email format.

You can also register a new account from the main login screen. Leave applications are written to PostgreSQL through the Go API and appear in SSO leave management and Gatekeeper leave lookup. The browser keeps a local cache as an offline fallback.

## How the system works

- Each role has its own login flow and protected dashboard.
- The shared auth system checks the active session and role before allowing access to app pages.
- PostgreSQL is the shared source of truth when the Go API is running; the browser cache keeps the UI usable while offline.
- Gatekeepers can scan a card/QR, search the roster, open a camera preview for manual identity comparison, record an exit, and record a return with an optional note.
- Logout clears the session and sends the user back to the root login screen.

## Notes

This is a local prototype. The Go API and PostgreSQL database provide persistence, but authentication is still front-end-only and passwords are stored in browser localStorage. Add real identity management, authorization, HTTPS, and secret management before production use.
