/* ==========================================================================
   CampusX · GCIT — Shared Data Store
   A tiny cross-portal layer (built on top of the same localStorage the
   session/auth system already uses) so that:
     - Leave requests a student submits appear instantly for SSO Admin and
       Gatekeeper to review — no separate "admin dataset" that drifts.
     - A brand-new account starts with a completely clean leave history
       (requests are always filtered by the logged-in student's real ID,
       never by a hardcoded demo list).
     - Every kind of request/action across the system (leave requests,
       decisions, visitor check-ins, manual gate records, event-mode
       changes...) lands in one unified "recent activity" feed that both
       admin surfaces can render.
     - Settings like Event Mode are a single source of truth shared by the
       SSO console and the Gatekeeper app.
   ========================================================================== */
(function (global) {
  const LEAVE_KEY = 'campusx_leaves';
  const ACTIVITY_KEY = 'campusx_activity';
  const EVENT_KEY = 'campusx_event_mode';
  const SEED_FLAG = 'campusx_leaves_seeded_v1';

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 900 + 100);
  }

  /* ---------------- Leave requests (real, per-account) ---------------- */

  function getAllLeaves() { return load(LEAVE_KEY, []); }
  function saveAllLeaves(list) { save(LEAVE_KEY, list); }

  // Every request is tagged with the real logged-in student's ID, so a
  // freshly-registered account naturally has zero history — nothing to
  // reset, there's simply nothing stored under that ID yet.
  function getLeavesFor(studentId) {
    return getAllLeaves().filter(l => l.studentId === studentId);
  }

  function addLeave(studentId, studentName, data) {
    const list = getAllLeaves();
    const rec = Object.assign({ id: uid('LV') }, data, {
      studentId, studentName,
      status: data.status || 'pending',
      createdAt: new Date().toISOString()
    });
    list.unshift(rec);
    saveAllLeaves(list);
    addActivity({
      type: 'leave', title: 'New leave request',
      detail: `${studentName} requested leave to ${rec.destination || 'off campus'}.`,
      actor: studentName
    });
    return rec;
  }

  function updateLeave(id, patch) {
    const list = getAllLeaves();
    const rec = list.find(l => l.id === id);
    if (!rec) return null;
    Object.assign(rec, patch);
    saveAllLeaves(list);
    return rec;
  }

  function decideLeave(id, status, decidedBy) {
    const rec = updateLeave(id, { status, decidedAt: new Date().toISOString(), decidedBy: decidedBy || 'Admin' });
    if (rec) {
      addActivity({
        type: 'leave-decision', title: `Leave ${status}`,
        detail: `${rec.studentName}'s request to ${rec.destination || 'off campus'} was ${status} by ${decidedBy || 'Admin'}.`,
        actor: decidedBy || 'Admin'
      });
    }
    return rec;
  }

  function removeLeave(id) {
    saveAllLeaves(getAllLeaves().filter(l => l.id !== id));
  }

  // Seeds a small demo history for the seeded demo student account only,
  // exactly once, ever. Any other (including newly-registered) student ID
  // simply has no rows and therefore renders as fresh/empty.
  function ensureDemoSeed() {
    if (localStorage.getItem(SEED_FLAG)) return;
    const list = getAllLeaves();
    list.push(
      { id: uid('LV'), studentId: 'STU-2024-014', studentName: 'Karma Wangchuk', destination: 'Gyalpozhing Market', date: '2026-09-01', dateLabel: '01 Sep 2026', reason: 'Personal errand', status: 'approved', duration: '3h', exitTime: '5:00 PM', returnTime: '8:00 PM', purpose: 'Pick up a parcel and buy stationery for the semester.', warden: 'Warden Sonam Dorji', block: 'GCIT Block-C', createdAt: new Date(Date.now() - 86400000 * 8).toISOString() },
      { id: uid('LV'), studentId: 'STU-2024-014', studentName: 'Karma Wangchuk', destination: 'Thimphu Town', date: '2026-08-24', dateLabel: '24 Aug 2026', reason: 'Family visit', status: 'completed', duration: '5h', exitTime: '10:00 AM', returnTime: '3:00 PM', purpose: 'Spending the day with parents in town before the term picks up.', warden: 'Warden Sonam Dorji', block: 'GCIT Block-C', createdAt: new Date(Date.now() - 86400000 * 16).toISOString() },
      { id: uid('LV'), studentId: 'STU-2024-014', studentName: 'Karma Wangchuk', destination: 'Library Research', date: '2026-08-12', dateLabel: '12 Aug 2026', reason: 'Academic off-campus', status: 'completed', duration: '2h', exitTime: '1:00 PM', returnTime: '3:00 PM', purpose: 'Referencing archival material at the National Library.', warden: 'Warden Sonam Dorji', block: 'GCIT Block-C', createdAt: new Date(Date.now() - 86400000 * 28).toISOString() }
    );
    saveAllLeaves(list);
    localStorage.setItem(SEED_FLAG, '1');
  }

  /* ---------------- Unified activity feed (every request type) ---------------- */

  function getActivity(limit) {
    const list = load(ACTIVITY_KEY, []);
    return typeof limit === 'number' ? list.slice(0, limit) : list;
  }

  function addActivity(entry) {
    const list = load(ACTIVITY_KEY, []);
    list.unshift(Object.assign({ id: uid('ACT'), time: new Date().toISOString() }, entry));
    if (list.length > 250) list.length = 250;
    save(ACTIVITY_KEY, list);
    try { window.dispatchEvent(new CustomEvent('cx:activity', { detail: entry })); } catch (e) {}
  }

  function timeAgo(iso) {
    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + ' min ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + (hrs === 1 ? ' hr ago' : ' hrs ago');
    const days = Math.floor(hrs / 24);
    return days + (days === 1 ? ' day ago' : ' days ago');
  }

  /* ---------------- Event Mode (shared by SSO + Gatekeeper) ---------------- */

  function getEventMode() {
    return load(EVENT_KEY, {
      active: false, name: '', startDate: '', endDate: '',
      startTime: '08:00', endTime: '18:00',
      allow: { students: true, staff: true, visitors: true }
    });
  }
  function setEventMode(ev) {
    const prev = getEventMode();
    save(EVENT_KEY, ev);
    if (!!prev.active !== !!ev.active) {
      addActivity({
        type: 'system', title: ev.active ? 'Event Mode enabled' : 'Event Mode disabled',
        detail: ev.active ? `${ev.name || 'Event'} is now active — relaxed access rules and manual approval apply.` : 'Normal operating period restored across gate and admin systems.',
        actor: 'System'
      });
    }
    try { window.dispatchEvent(new CustomEvent('cx:eventmode', { detail: ev })); } catch (e) {}
  }

  ensureDemoSeed();

  global.CXStore = {
    getAllLeaves, saveAllLeaves, getLeavesFor, addLeave, updateLeave, decideLeave, removeLeave,
    getActivity, addActivity, timeAgo,
    getEventMode, setEventMode
  };
})(window);
