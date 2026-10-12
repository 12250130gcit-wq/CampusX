import { useEffect, useState } from "react";
import auth from "../services/auth.js";
import { Link } from "./UI.jsx";
const items = [
  ["index", "Dashboard"],
  ["verification", "Scan / Verify"],
  ["outside-students", "Students Outside"],
  ["overdue", "Overdue Students"],
  ["movement-logs", "Entry / Exit Logs"],
  ["visitor-register", "Register Visitor"],
  ["visitors", "Visitors Inside"],
  ["leave-lookup", "Leave Lookup"],
  ["students", "Student Directory"],
  ["event-mode", "Event Mode"],
  ["manual-record", "Manual Entry / Exit"],
  ["reports", "Reports"],
  ["notifications", "Notifications"],
  ["profile", "My Profile"],
  ["settings", "Settings"],
];
export default function GateShell({ page, children }) {
  const [open, setOpen] = useState(false),
    [now, setNow] = useState(new Date());
  const session = auth.getSession();
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => setOpen(false), [page]);
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "open" : ""}`} id="sidebar-wrap">
        <div id="sidebar-root">
          <div className="sidebar-brand">
            <div className="brand-mark">CX</div>
            <div>
              <strong>CampusX</strong>
              <small>GCIT · Gatekeeper</small>
            </div>
          </div>
          <nav>
            {items.map(([key, label]) => (
              <Link
                key={key}
                className={`nav-link ${page === key ? "active" : ""}`}
                href={`/gatekeeper/${key}.html`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="sidebar-footer">
            <strong>{session.name}</strong>
            <button className="btn btn-outline" onClick={() => auth.logout()}>
              Log Out
            </button>
          </div>
        </div>
      </aside>
      {open && (
        <div className="sidebar-backdrop show" onClick={() => setOpen(false)} />
      )}
      <div className="main-col">
        <header className="topbar" id="topbar-root">
          <button
            className="icon-btn"
            aria-label="Toggle navigation"
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>
          <h1>{items.find(([key]) => key === page)?.[1] || "Gatekeeper"}</h1>
          <div className="topbar-right">
            <span>{now.toLocaleTimeString()}</span>
            <Link
              href="/gatekeeper/notifications.html"
              className="btn btn-outline"
            >
              Notifications
            </Link>
            <Link href="/gatekeeper/profile.html">{session.name}</Link>
          </div>
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
