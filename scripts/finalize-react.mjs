import fs from 'node:fs';
import path from 'node:path';
let auth=fs.readFileSync('src/services/auth.js','utf8');
auth=auth.replace(/function currentPathIsNested\(\)[\s\S]*?function getSession\(\)/,'function getSession()');
auth=auth.replace(/function requireRole\(role\)[\s\S]*?function logout\(\)/,'function logout()');
auth=auth.replace('  requireRole,\n','');
fs.writeFileSync('src/services/auth.js',auth);
let readme=fs.readFileSync('README.md','utf8');
const start=readme.indexOf('## Project structure'),end=readme.indexOf('## Build and test');
readme=readme.slice(0,start)+`## Project structure

\`\`\`text
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
\`\`\`

Every screen is implemented in JSX with React state, props, effects, and event handlers. Tables, dialogs, search results, navigation, and forms are rendered by React. The previous DOM controllers and separate HTML page files have been removed.

The app retains original URLs such as \`/student/index.html\`, \`/sso/index.html\`, and \`/gatekeeper/verification.html\` for compatibility; these are now client-side routes, not HTML files. Navigation uses browser history without reloading the document. The Go backend and shared JavaScript data utilities remain separate from the React UI.

`+readme.slice(end);
readme=readme.replace('For deployment, configure the host to proxy','For deployment, configure the host to serve `index.html` for frontend routes and proxy');
readme=readme.replace('npm test\n```','npm test\nnpm run test:production\n```');
readme=readme.replace('Browser checks cover every protected page, login/logout, unauthorized redirects, and the student-to-SSO-to-gatekeeper leave workflow.','Browser checks cover every protected page, login/logout, registration, unauthorized redirects, React navigation and browser Back, visitor registration/checkout, event settings, gate exit/return persistence, and the student-to-SSO-to-gatekeeper leave workflow.');
readme=readme.replace('- Gatekeepers can scan a card/QR or use Face Match to open a student\'s identity and leave details, record an exit, and record a return with an optional note.','- Gatekeepers can scan a card/QR, search the roster, open a camera preview for manual identity comparison, record an exit, and record a return with an optional note.');
fs.writeFileSync('README.md',readme);
const root=path.resolve('.');
for(const dir of ['src/controllers','src/entries','student','sso','gatekeeper']) {
 const absolute=path.resolve(dir);if(!absolute.startsWith(root+path.sep))throw Error('Outside workspace');
 if(!fs.existsSync(absolute))continue;
 // Remove only empty directories left by the migration; preserve any other files.
 function empty(p){for(const item of fs.readdirSync(p,{withFileTypes:true}))if(item.isDirectory())empty(path.join(p,item.name));if(!fs.readdirSync(p).length)fs.rmdirSync(p);}
 empty(absolute);
}
fs.unlinkSync('scripts/remove-old-frontend.mjs');
