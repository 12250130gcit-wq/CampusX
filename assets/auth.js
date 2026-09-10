(function (global) {
  const SESSION_KEY = 'campusx_session_v1';
  const ACCOUNTS_KEY = 'campusx_accounts_v1';

  const ROLE_LABEL = {
    student: 'Student',
    sso: 'SSO Admin',
    gatekeeper: 'Gatekeeper'
  };

  const ROLE_HOME = {
    student: 'student/index.html',
    sso: 'sso/index.html',
    gatekeeper: 'gatekeeper/index.html'
  };

  const DEMO_ACCOUNTS = {
    student: [{
      id: 'STU-2024-014',
      name: 'Karma Wangchuk',
      password: 'student123',
      email: 'karma@gcit.edu.bt'
    }],
    sso: [{
      id: 'ADM-SSO-001',
      name: 'Karma Wangdi',
      password: 'sso@admin123',
      email: 'admin@gcit.edu.bt'
    }],
    gatekeeper: [{
      id: 'GK-001',
      name: 'Nima Dorji',
      password: 'gate@2024',
      email: 'gatekeeper@gcit.edu.bt'
    }]
  };

  function safeParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function storageGet(key, fallback) {
    return safeParse(localStorage.getItem(key), fallback);
  }

  function storageSet(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getAccounts() {
    const existing = storageGet(ACCOUNTS_KEY, null);
    if (existing) return existing;

    const seeded = JSON.parse(JSON.stringify(DEMO_ACCOUNTS));
    storageSet(ACCOUNTS_KEY, seeded);
    return seeded;
  }

  function saveAccounts(accounts) {
    storageSet(ACCOUNTS_KEY, accounts);
  }

  function normalizeRole(role) {
    return ROLE_LABEL[role] ? role : null;
  }

  function currentPathIsNested() {
    const path = window.location.pathname || '';
    return /\/student\//.test(path) || /\/sso\//.test(path) || /\/gatekeeper\//.test(path);
  }

  function toRoleUrl(role, queryParam) {
    const rootUrl = ROLE_HOME[role];
    const current = window.location.href;
    const targetPath = currentPathIsNested() ? '../' + rootUrl : rootUrl;
    const resolved = new URL(targetPath, current);
    if (queryParam) {
      resolved.searchParams.set('denied', queryParam);
    }
    return resolved.toString();
  }

  function getSession() {
    return storageGet(SESSION_KEY, null);
  }

  function setSession(session) {
    storageSet(SESSION_KEY, session);
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function login(role, id, password) {
    const safeRole = normalizeRole(role);
    const cleanId = String(id || '').trim();
    const cleanPw = String(password || '');

    if (!safeRole) {
      return { ok: false, error: 'Invalid role selected.' };
    }

    if (!cleanId) {
      return { ok: false, error: 'Enter your account ID.' };
    }

    if (!cleanPw) {
      return { ok: false, error: 'Password can\'t be empty.' };
    }

    const accounts = getAccounts();
    const bucket = accounts[safeRole] || [];
    const match = bucket.find((account) => account.id.toLowerCase() === cleanId.toLowerCase());

    if (!match) {
      return { ok: false, error: 'No account matches that ID for this role.' };
    }

    if (match.password !== cleanPw) {
      return { ok: false, error: 'Incorrect password for this account.' };
    }

    const session = {
      role: safeRole,
      id: match.id,
      name: match.name,
      email: match.email || ''
    };

    setSession(session);
    return { ok: true, account: session };
  }

  function register(role, data) {
    const safeRole = normalizeRole(role);
    const account = {
      id: String(data && data.id ? data.id.trim() : ''),
      name: String(data && data.name ? data.name.trim() : ''),
      password: String(data && data.password ? data.password : ''),
      email: String((data && data.email) || '')
    };

    if (!safeRole) {
      return { ok: false, error: 'Invalid role selected.' };
    }

    if (!account.id) {
      return { ok: false, error: 'Enter an ID.' };
    }

    if (!account.name) {
      return { ok: false, error: 'Enter your full name.' };
    }

    if (!account.password || account.password.length < 8) {
      return { ok: false, error: 'Password must be at least 8 characters.' };
    }

    const accounts = getAccounts();
    const bucket = accounts[safeRole] || [];

    const exists = bucket.some((item) => item.id.toLowerCase() === account.id.toLowerCase());
    if (exists) {
      return { ok: false, error: 'That ID is already in use.' };
    }

    bucket.push({
      id: account.id,
      name: account.name,
      password: account.password,
      email: account.email
    });

    accounts[safeRole] = bucket;
    saveAccounts(accounts);
    return { ok: true, account: { role: safeRole, id: account.id, name: account.name, email: account.email } };
  }

  function requireRole(role) {
    const session = getSession();
    if (!session || session.role !== role) {
      window.location.href = toRoleUrl(role, role);
      return null;
    }
    return session;
  }

  function logout() {
    clearSession();
    window.location.href = currentPathIsNested() ? '../index.html' : 'index.html';
  }

  function goToRoleHome(role) {
    window.location.href = toRoleUrl(role);
  }

  global.CXAuth = {
    ROLE_LABEL,
    ROLE_HOME,
    login,
    register,
    getSession,
    setSession,
    clearSession,
    requireRole,
    logout,
    goToRoleHome
  };
})(window);
