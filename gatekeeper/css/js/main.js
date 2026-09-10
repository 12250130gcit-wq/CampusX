/* ==========================================================================
   CampusX — shared shell: sidebar, topbar, clock, toasts, modal helpers.
   Every page sets window.CX_PAGE (nav key) and window.CX_TITLE before this
   file runs, then calls cxInitShell() on DOMContentLoaded.
   ========================================================================== */

const CX_ICONS = {
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V5a1 1 0 0 1 1-1h2M20 7V5a1 1 0 0 0-1-1h-2M4 17v2a1 1 0 0 0 1 1h2M20 17v2a1 1 0 0 1-1 1h-2M4 12h16"/></svg>',
  logout_door: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 21V3h9v18M5 21h14M14 12h.01"/></svg>',
  clock_alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 3h6"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  user_plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6M18 8v6M21 11h-6"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="3.3"/><path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 8.2a3.3 3.3 0 1 1 3 4.9M17 14c2.8.3 5 2.6 5 5.5"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/><path d="M12 8v4l3 2"/></svg>',
  check_shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>',
  id_card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c0-1.5 1.3-2.5 3-2.5s3 1 3 2.5M15 10h4M15 14h4"/></svg>',
  calendar_check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 3v3M16 3v3M9 14l2 2 4-4"/></svg>',
  bar_chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M12 20V4M20 20v-7"/><path d="M2 20h20"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  chevron_down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5c0 8.3 6.7 15 15 15l3-4-6-3-2 2c-2-1-4.6-3.5-5.5-5.5l2-2-3-6-4-1z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6L9 17l-5-5"/></svg>',
  qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h.01"/></svg>',
  arrow_left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  log_in: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M15 17l5-5-5-5M20 12H9"/></svg>',
  log_out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M9 17l-5-5 5-5M4 12h11"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>'
};

const CX_NAV = [
  { section:null, items:[ { key:'dashboard', label:'Dashboard', href:'index.html', icon:'grid' } ] },
  { section:'Gate Operations', items:[
    { key:'verify', label:'Scan / Verify', href:'verification.html', icon:'scan' },
    { key:'outside', label:'Students Outside', href:'outside-students.html', icon:'log_out' },
    { key:'overdue', label:'Overdue Students', href:'overdue.html', icon:'clock_alert' },
    { key:'logs', label:'Entry / Exit Logs', href:'movement-logs.html', icon:'list' }
  ]},
  { section:'Visitors', items:[
    { key:'visitor-register', label:'Register Visitor', href:'visitor-register.html', icon:'user_plus' },
    { key:'visitors', label:'Visitors Inside', href:'visitors.html', icon:'users' },
    { key:'visitor-history', label:'Visitor History', href:'visitors.html#history', icon:'history' }
  ]},
  { section:'Permissions', items:[
    { key:'leave-lookup', label:'Leave Lookup', href:'leave-lookup.html', icon:'check_shield' }
  ]},
  { section:'Management', items:[
    { key:'students', label:'Student Directory', href:'students.html', icon:'id_card' },
    { key:'event-mode', label:'Event Mode', href:'event-mode.html', icon:'calendar_check' },
    { key:'reports', label:'Reports', href:'reports.html', icon:'bar_chart' }
  ]},
  { section:'System', items:[
    { key:'notifications', label:'Notifications', href:'notifications.html', icon:'bell' },
    { key:'manual-record', label:'Manual Entry / Exit', href:'manual-record.html', icon:'log_in' },
    { key:'settings', label:'Settings', href:'settings.html', icon:'settings' }
  ]}
];

function cxBuildSidebar(activeKey){
  const groups = CX_NAV.map(group => {
    const items = group.items.map(item => `
      <a class="sidebar-link ${item.key === activeKey ? 'active' : ''}" href="${item.href}">
        ${CX_ICONS[item.icon] || ''}<span>${item.label}</span>
      </a>`).join('');
    return `${group.section ? `<div class="sidebar-group-label">${group.section}</div>` : ''}${items}`;
  }).join('');

  return `
    <div class="sidebar-brand">
      <div class="sidebar-brand-mark">CX</div>
      <div class="sidebar-brand-text">
        <div class="name">CampusX</div>
        <div class="sub">GCIT</div>
      </div>
    </div>
    <div class="sidebar-tagline">Gate Administration</div>
    <nav class="sidebar-nav">${groups}</nav>
    <div class="sidebar-foot">
      <a class="sidebar-link ${activeKey === 'profile' ? 'active' : ''}" href="profile.html">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        <span>Profile</span>
      </a>
      <a class="sidebar-link logout" href="#" onclick="if(confirm('Log out of CampusX?')){ CXAuth.logout(); } return false;">
        ${CX_ICONS.logout_door}<span>Logout</span>
      </a>
    </div>`;
}

function cxBuildTopbar(title, breadcrumb){
  const unread = (typeof CxData !== 'undefined') ? CxData.getNotifications().length : 0;
  const cxName = (window.cxSession && window.cxSession.name) || 'Sonam Tshering';
  const cxInitials = cxName.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
  const cxFirst = cxName.split(' ')[0];
  return `
    <button class="hamburger" id="cx-hamburger" aria-label="Open menu">${CX_ICONS.menu}</button>
    <div class="topbar-title">
      <h1>${title}</h1>
      ${breadcrumb ? `<div class="breadcrumb">${breadcrumb}</div>` : ''}
    </div>
    <div class="topbar-meta">
      <div class="gate-status-pill"><span class="dot"></span>Gate Online</div>
      <div class="topbar-clock" id="cx-clock">
        <span id="cx-clock-time">--:--</span>
        <span class="date" id="cx-clock-date">--</span>
      </div>
      <a class="icon-btn" href="notifications.html" aria-label="Notifications">
        ${CX_ICONS.bell}
        ${unread > 0 ? '<span class="badge-dot"></span>' : ''}
      </a>
      <a class="topbar-profile" href="profile.html">
        <div class="avatar">${cxInitials}</div>
        <div class="topbar-profile-text">
          <div class="n">${cxFirst}</div>
          <div class="r">Gatekeeper</div>
        </div>
      </a>
    </div>`;
}

function cxInitClock(){
  function tick(){
    const now = new Date();
    const timeEl = document.getElementById('cx-clock-time');
    const dateEl = document.getElementById('cx-clock-date');
    if(timeEl) timeEl.textContent = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    if(dateEl) dateEl.textContent = now.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' });
  }
  tick();
  setInterval(tick, 1000);
}

function cxInitShell(){
  const sidebarRoot = document.getElementById('sidebar-root');
  const topbarRoot = document.getElementById('topbar-root');
  const backdropRoot = document.getElementById('backdrop-root');
  if(sidebarRoot) sidebarRoot.innerHTML = cxBuildSidebar(window.CX_PAGE || '');
  if(topbarRoot) topbarRoot.innerHTML = cxBuildTopbar(window.CX_TITLE || '', window.CX_BREADCRUMB || '');
  if(backdropRoot) backdropRoot.innerHTML = '<div class="sidebar-backdrop" id="cx-backdrop"></div>';

  cxInitClock();

  const sidebarEl = sidebarRoot ? sidebarRoot.parentElement : null;
  const hamburger = document.getElementById('cx-hamburger');
  const backdrop = document.getElementById('cx-backdrop');
  function openNav(){ sidebarEl && sidebarEl.classList.add('open'); backdrop && backdrop.classList.add('open'); }
  function closeNav(){ sidebarEl && sidebarEl.classList.remove('open'); backdrop && backdrop.classList.remove('open'); }
  if(hamburger) hamburger.addEventListener('click', openNav);
  if(backdrop) backdrop.addEventListener('click', closeNav);
}

/* ---------------- Toasts ---------------- */

function cxToast(message, type){
  let stack = document.getElementById('toast-stack');
  if(!stack){
    stack = document.createElement('div');
    stack.id = 'toast-stack';
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

/* ---------------- Modal helpers ---------------- */

function cxOpenModal(id){
  const el = document.getElementById(id);
  if(el) el.classList.add('open');
}
function cxCloseModal(id){
  const el = document.getElementById(id);
  if(el) el.classList.remove('open');
}

function cxStatusBadge(status){
  const map = {
    outside: ['badge-outside','Outside'],
    inside: ['badge-inside','Inside'],
    overdue: ['badge-overdue','Overdue'],
    approved: ['badge-approved','Approved'],
    pending: ['badge-pending','Pending'],
    rejected: ['badge-rejected','Rejected'],
    rejected_recent: ['badge-rejected','Rejected'],
    expired: ['badge-neutral','Expired'],
    none: ['badge-neutral','No Active Leave'],
    inside_visitor: ['badge-inside','Inside'],
    checked_out: ['badge-neutral','Checked Out']
  };
  const [cls, label] = map[status] || ['badge-neutral', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function cxFillIcons(root){
  const scope = root || document;
  scope.querySelectorAll('[data-icon]').forEach(el => {
    const name = el.getAttribute('data-icon');
    if(CX_ICONS[name]) el.innerHTML = CX_ICONS[name];
  });
}

document.addEventListener('DOMContentLoaded', function(){
  cxInitShell();
  cxFillIcons();
  const page = document.querySelector('main.page');
  if(page) page.classList.add('cx-animate-in');
  document.querySelectorAll('.stat-card, .card').forEach((el, i) => {
    el.style.animationDelay = Math.min(i * 35, 250) + 'ms';
    el.classList.add('cx-pop-in');
  });
});
