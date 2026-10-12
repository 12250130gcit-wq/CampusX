import auth from "./auth.js";
import store from "./store.js";
import roster from "./roster.js";
import { load, save } from "./storage.js";

const actor = () => auth.getSession()?.name || "Gatekeeper";
const clock = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
export const initials = (name) =>
  String(name || "")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const gate = {
  getStudents() {
    const source = store.getRoster().length ? store.getRoster() : roster;
    const accounts = (auth.getAccounts().student || []).filter(
      (a) => !source.some((s) => s.id === a.id),
    );
    const saved = load("cx_students", []);
    return [
      ...source,
      ...accounts.map(({ id, name }) => ({
        id,
        name,
        program: "Registered student",
      })),
    ].map((raw) => {
      const s = { ...raw, ...saved.find((item) => item.id === raw.id) };
      const leave = store.getLeavesFor(s.id)[0];
      return {
        ...s,
        initials: initials(s.name),
        status: s.status || "inside",
        hostel: s.hostel || "GCIT Student Roster",
        room: s.room || "Not provided",
        contact: s.contact || "Not provided",
        leave: leave?.status || "none",
        destination: leave?.destination || "—",
        exitTime: s.lastExitAt
          ? new Date(s.lastExitAt).toLocaleTimeString()
          : leave?.exitTime || "—",
        expectedReturn: s.expectedReturn || leave?.returnTime || "—",
        approvedBy: leave?.decidedBy || "SSO / Warden",
      };
    });
  },
  getVisitors: () => load("cx_visitors", []),
  getLogs: () => load("cx_logs", []),
  getNotifications: () => load("cx_notifications", []),
  getAudit: () => load("cx_audit", []),
  addAudit(title, detail) {
    const item = {
      id: crypto.randomUUID(),
      title,
      detail,
      time: clock(),
      timestamp: new Date().toISOString(),
      actor: actor(),
    };
    save("cx_audit", [item, ...gate.getAudit()]);
    store.addActivity({ type: "gate", title, detail, actor: actor() });
  },
  addLog(data) {
    save("cx_logs", [
      {
        ...data,
        logId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
      ...gate.getLogs(),
    ]);
  },
  recordMovement(id, action, note = "", method = "QR") {
    const student = gate.getStudents().find((s) => s.id === id);
    if (!student) return false;
    const patch = {
      id,
      status: action === "exit" ? "outside" : "inside",
      ...(action === "exit"
        ? {
            lastExitAt: new Date().toISOString(),
            expectedReturn: student.expectedReturn,
          }
        : {}),
    };
    save("cx_students", [
      patch,
      ...load("cx_students", []).filter((s) => s.id !== id),
    ]);
    gate.addLog({
      id,
      name: student.name,
      time: clock(),
      type: "Student",
      action: action === "exit" ? "EXIT" : "ENTRY",
      gate: "Main Gate",
      method,
      admin: actor(),
      status: "Recorded",
      note,
    });
    gate.addAudit(
      action === "exit" ? "Exit recorded" : "Entry recorded",
      `${student.name} (${id}): ${action}. ${note}`,
    );
    store.recordMovement(
      id,
      action,
      student.expectedReturn === "—" ? "" : student.expectedReturn,
      note,
      actor(),
    );
    return true;
  },
  recordExit: (id, note, method) =>
    gate.recordMovement(id, "exit", note, method),
  recordReturn: (id, note, method) =>
    gate.recordMovement(id, "return", note, method),
  registerVisitor(data) {
    const record = {
      ...data,
      id: "V-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
      checkIn: clock(),
      status: "inside",
      timestamp: new Date().toISOString(),
    };
    save("cx_visitors", [record, ...gate.getVisitors()]);
    gate.addLog({
      id: record.id,
      name: record.name,
      time: record.checkIn,
      type: "Visitor",
      action: "CHECK-IN",
      gate: "Main Gate",
      method: "Manual",
      admin: actor(),
      status: "Recorded",
    });
    gate.addAudit(
      "Visitor registered",
      `${record.name} is visiting ${record.visiting}.`,
    );
    return record;
  },
  checkOutVisitor(id) {
    const visitor = gate.getVisitors().find((v) => v.id === id);
    if (!visitor || visitor.status !== "inside") return;
    save(
      "cx_visitors",
      gate
        .getVisitors()
        .map((v) =>
          v.id === id ? { ...v, status: "checked_out", checkOut: clock() } : v,
        ),
    );
    gate.addLog({
      id,
      name: visitor.name,
      time: clock(),
      type: "Visitor",
      action: "CHECK-OUT",
      gate: "Main Gate",
      method: "Manual",
      admin: actor(),
      status: "Recorded",
    });
    gate.addAudit("Visitor checked out", visitor.name);
  },
  addManualRecord(data) {
    gate.addLog({
      ...data,
      id: data.studentId,
      action: data.type,
      type: "Student",
      gate: "Main Gate",
      admin: actor(),
      status: "Manual",
    });
    gate.addAudit(
      "Manual record added",
      `${data.name}: ${data.type}. ${data.reason}`,
    );
  },
};
export default gate;
