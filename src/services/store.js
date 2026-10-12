const LEAVE_KEY = "campusx_leaves";
const ACTIVITY_KEY = "campusx_activity";
const EVENT_KEY = "campusx_event_mode";
const CLEAN_KEY = "campusx_clean_state_v2";
const ROSTER_KEY = "campusx_roster";
const API_BASE =
  window.CAMPUSX_API_URL || import.meta.env.VITE_API_URL || "/api";

if (!localStorage.getItem(CLEAN_KEY)) {
  localStorage.removeItem(LEAVE_KEY);
  localStorage.removeItem(ACTIVITY_KEY);
  localStorage.setItem(CLEAN_KEY, "1");
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  notifySync();
}

async function apiRequest(path, options) {
  const response = await fetch(
    API_BASE + path,
    Object.assign(
      { headers: { "Content-Type": "application/json" } },
      options || {},
    ),
  );
  if (!response.ok) throw new Error("CampusX API returned " + response.status);
  return response.json();
}

function notifySync() {
  try {
    window.dispatchEvent(new CustomEvent("cx:store-sync"));
  } catch (e) {}
}

function uid(prefix) {
  return (
    prefix +
    "-" +
    Date.now().toString(36).toUpperCase() +
    Math.floor(Math.random() * 900 + 100)
  );
}

/* ---------------- Leave requests (real, per-account) ---------------- */

function getAllLeaves() {
  return load(LEAVE_KEY, []);
}
function saveAllLeaves(list) {
  save(LEAVE_KEY, list);
}

// Every request is tagged with the real logged-in student's ID, so a
// freshly-registered account naturally has zero history — nothing to
// reset, there's simply nothing stored under that ID yet.
function getLeavesFor(studentId) {
  return getAllLeaves().filter((l) => l.studentId === studentId);
}

function addLeave(studentId, studentName, data) {
  const list = getAllLeaves();
  const rec = Object.assign({ id: uid("LV") }, data, {
    studentId,
    studentName,
    status: data.status || "pending",
    createdAt: new Date().toISOString(),
  });
  list.unshift(rec);
  saveAllLeaves(list);
  addActivity({
    type: "leave",
    title: "New leave request",
    detail: `${studentName} requested leave to ${rec.destination || "off campus"}.`,
    actor: studentName,
  });
  apiRequest("/leaves", {
    method: "POST",
    body: JSON.stringify({
      studentId,
      studentName,
      date: rec.date,
      dateLabel: rec.dateLabel,
      exitTime: rec.exitTime,
      returnTime: rec.returnTime,
      destination: rec.destination,
      reason: rec.reason,
      purpose: rec.purpose,
    }),
  })
    .then((serverRecord) => {
      const current = getAllLeaves().map((item) =>
        item.id === rec.id ? serverRecord : item,
      );
      saveAllLeaves(current);
      notifySync();
    })
    .catch(() => {});
  return rec;
}

function updateLeave(id, patch) {
  const list = getAllLeaves();
  const rec = list.find((l) => l.id === id);
  if (!rec) return null;
  Object.assign(rec, patch);
  saveAllLeaves(list);
  return rec;
}

function decideLeave(id, status, decidedBy) {
  const rec = updateLeave(id, {
    status,
    decidedAt: new Date().toISOString(),
    decidedBy: decidedBy || "Admin",
  });
  if (rec) {
    addActivity({
      type: "leave-decision",
      title: `Leave ${status}`,
      detail: `${rec.studentName}'s request to ${rec.destination || "off campus"} was ${status} by ${decidedBy || "Admin"}.`,
      actor: decidedBy || "Admin",
    });
    apiRequest("/leaves/" + encodeURIComponent(id), {
      method: "PATCH",
      body: JSON.stringify({ status, decidedBy: decidedBy || "Admin" }),
    })
      .then((serverRecord) => {
        saveAllLeaves(
          getAllLeaves().map((item) => (item.id === id ? serverRecord : item)),
        );
        notifySync();
      })
      .catch(() => {});
  }
  return rec;
}

function removeLeave(id) {
  saveAllLeaves(getAllLeaves().filter((l) => l.id !== id));
}

/* ---------------- Unified activity feed (every request type) ---------------- */

function getActivity(limit) {
  const list = load(ACTIVITY_KEY, []);
  return typeof limit === "number" ? list.slice(0, limit) : list;
}

function addActivity(entry) {
  const list = load(ACTIVITY_KEY, []);
  list.unshift(
    Object.assign({ id: uid("ACT"), time: new Date().toISOString() }, entry),
  );
  if (list.length > 250) list.length = 250;
  save(ACTIVITY_KEY, list);
  try {
    window.dispatchEvent(new CustomEvent("cx:activity", { detail: entry }));
  } catch (e) {}
}

function timeAgo(iso) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return mins + " min ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + (hrs === 1 ? " hr ago" : " hrs ago");
  const days = Math.floor(hrs / 24);
  return days + (days === 1 ? " day ago" : " days ago");
}

/* ---------------- Event Mode (shared by SSO + Gatekeeper) ---------------- */

function getEventMode() {
  return load(EVENT_KEY, {
    active: false,
    name: "",
    startDate: "",
    endDate: "",
    startTime: "08:00",
    endTime: "18:00",
    allow: { students: true, staff: true, visitors: true },
  });
}
function setEventMode(ev) {
  const prev = getEventMode();
  save(EVENT_KEY, ev);
  if (!!prev.active !== !!ev.active) {
    addActivity({
      type: "system",
      title: ev.active ? "Event Mode enabled" : "Event Mode disabled",
      detail: ev.active
        ? `${ev.name || "Event"} is now active — relaxed access rules and manual approval apply.`
        : "Normal operating period restored across gate and admin systems.",
      actor: "System",
    });
  }
  try {
    window.dispatchEvent(new CustomEvent("cx:eventmode", { detail: ev }));
  } catch (e) {}
}

async function syncFromApi() {
  try {
    const [leaves, activity, students] = await Promise.all([
      apiRequest("/leaves"),
      apiRequest("/activity"),
      apiRequest("/students"),
    ]);
    saveAllLeaves(leaves);
    save(ACTIVITY_KEY, activity);
    save(ROSTER_KEY, students);
    notifySync();
    return true;
  } catch (e) {
    return false;
  }
}

const store = {
  getAllLeaves,
  saveAllLeaves,
  getLeavesFor,
  addLeave,
  updateLeave,
  decideLeave,
  removeLeave,
  getActivity,
  addActivity,
  timeAgo,
  getEventMode,
  setEventMode,
  syncFromApi,
  getRoster: () => load(ROSTER_KEY, []),
  recordMovement: (studentId, action, expectedReturn, note, recordedBy) =>
    apiRequest("/movements", {
      method: "POST",
      body: JSON.stringify({
        studentId,
        action,
        expectedReturn: expectedReturn || "",
        note: note || "",
        recordedBy: recordedBy || "Gatekeeper",
      }),
    })
      .then((result) => {
        syncFromApi();
        return result;
      })
      .catch(() => null),
};

export default store;
