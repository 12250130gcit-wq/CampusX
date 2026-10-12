import { useState } from "react";
import auth from "../services/auth.js";
import store from "../services/store.js";
import gate from "../services/gate.js";
import { load, save } from "../services/storage.js";
import useCampus from "../hooks/useCampus.js";
import { navigate } from "../services/navigation.js";
import { Badge, PageHead, Stats, Table, useToast } from "../components/UI.jsx";
import LeaveManagement from "../components/LeaveManagement.jsx";
import StudentDirectory from "../components/StudentDirectory.jsx";
import GatekeeperMovementLogs from "./GatekeeperMovementLogs.jsx";
import GatekeeperVisitors from "./GatekeeperVisitors.jsx";
import GatekeeperVisitorRegister from "./GatekeeperVisitorRegister.jsx";
import GatekeeperReports from "./GatekeeperReports.jsx";
import GatekeeperSettings from "./GatekeeperSettings.jsx";
import GatekeeperProfile from "./GatekeeperProfile.jsx";
import logo from "../../assets/gcit-logo.png";
const nav = [
  ["dashboard", "Overview"],
  ["leave", "Leave requests"],
  ["movement", "Live movement"],
  ["gate", "Gate verification"],
  ["visitors", "Visitors"],
  ["students", "Students"],
  ["reports", "Reports & audit"],
  ["settings", "Settings"],
  ["profile", "Profile"],
];
export default function SsoIndex({ view = "dashboard" }) {
  const data = useCampus(),
    session = auth.getSession(),
    toast = useToast(),
    [open, setOpen] = useState(false),
    [register, setRegister] = useState(false);
  const go = (key) => {
    setOpen(false);
    setRegister(false);
    navigate(`/sso/index.html#${key}`);
  };
  const page = nav.some(([key]) => key === view) ? view : "dashboard";
  const reviews = load("campusx-state", {}).gate || [];
  function resolve(review, grant) {
    const state = load("campusx-state", {});
    save("campusx-state", {
      ...state,
      gate: (state.gate || []).map((item) =>
        item.id === review.id
          ? { ...item, result: grant ? "Granted" : "Denied" }
          : item,
      ),
    });
    gate.addAudit(
      "Gate review resolved",
      `${review.student}: ${grant ? "Granted" : "Denied"}`,
    );
    toast("Gate review updated.");
  }
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "open" : ""}`} id="sidebar">
        <a
          className="brand"
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            go("dashboard");
          }}
        >
          <img src={logo} alt="GCIT logo" />
          <div>
            <strong>CampusX</strong>
            <span>GCIT Administration</span>
          </div>
        </a>
        <nav id="mainNav">
          {nav.map(([key, label]) => (
            <button
              key={key}
              className={`nav-item ${page === key ? "active" : ""}`}
              data-page={key}
              onClick={() => go(key)}
            >
              {label}
              {key === "leave" && (
                <b>
                  {data.leaves.filter((l) => l.status === "pending").length}
                </b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div>
            <strong id="sidebarName">{session.name}</strong>
            <span>System Administrator · SSO</span>
          </div>
          <button id="logoutBtn" onClick={() => auth.logout()}>
            Log out
          </button>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <button
            className="icon-btn mobile-only"
            id="menuBtn"
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>
          <div>
            <p>
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </p>
            <h1>{nav.find(([key]) => key === page)[1]}</h1>
          </div>
          <button
            className="btn btn-outline"
            onClick={() =>
              toast(
                `${data.leaves.filter((l) => l.status === "pending").length} pending leave requests`,
              )
            }
          >
            Notifications
          </button>
          <button className="btn btn-outline" onClick={() => go("profile")}>
            {session.name}
          </button>
        </header>
        <section className="content" id="content">
          {page === "dashboard" && (
            <>
              <div className="hero">
                <div>
                  <h2>Campus operations at a glance</h2>
                  <p>
                    Monitor student movement, approvals and visitors in real
                    time.
                  </p>
                </div>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    store.setEventMode({
                      ...data.event,
                      active: !data.event.active,
                    });
                    toast("Event mode updated.");
                  }}
                >
                  {data.event.active
                    ? "Disable Event Mode"
                    : "Enable Event Mode"}
                </button>
              </div>
              <Stats
                items={[
                  [
                    "Pending approvals",
                    data.leaves.filter((l) => l.status === "pending").length,
                  ],
                  [
                    "Students outside",
                    data.students.filter((s) =>
                      ["outside", "overdue"].includes(s.status),
                    ).length,
                  ],
                  [
                    "Visitors inside",
                    data.visitors.filter((v) => v.status === "inside").length,
                  ],
                  [
                    "Overdue students",
                    data.students.filter((s) => s.status === "overdue").length,
                  ],
                ]}
              />
              <div className="quick-actions">
                {[
                  ["leave", "Review requests"],
                  ["visitors", "Manage visitors"],
                  ["gate", "Resolve gate check"],
                  ["reports", "Reports"],
                ].map(([key, label]) => (
                  <button className="quick" key={key} onClick={() => go(key)}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="card card-pad">
                <h3>Recent activity</h3>
                {data.activity.slice(0, 8).map((a) => (
                  <div className="activity-item" key={a.id}>
                    <strong>{a.title}</strong>
                    <p>{a.detail}</p>
                  </div>
                ))}
              </div>
            </>
          )}
          {page === "leave" && <LeaveManagement />}
          {page === "movement" && <GatekeeperMovementLogs />}
          {page === "gate" && (
            <>
              <PageHead
                title="Gate verification"
                description="Resolve identity and access checks referred to SSO."
              />
              <Table
                rows={reviews}
                columns={[
                  { label: "Student", key: "student" },
                  { label: "ID", key: "sid" },
                  {
                    label: "Result",
                    render: (r) => <Badge status={r.result} />,
                  },
                  {
                    label: "Action",
                    render: (r) =>
                      r.result === "Manual" ? (
                        <>
                          <button
                            className="btn btn-primary"
                            onClick={() => resolve(r, true)}
                          >
                            Grant
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => resolve(r, false)}
                          >
                            Deny
                          </button>
                        </>
                      ) : (
                        "Resolved"
                      ),
                  },
                ]}
              />
            </>
          )}
          {page === "visitors" && (
            <>
              {register ? (
                <>
                  <button
                    className="btn btn-outline"
                    onClick={() => setRegister(false)}
                  >
                    Back to visitors
                  </button>
                  <GatekeeperVisitorRegister />
                </>
              ) : (
                <GatekeeperVisitors onRegister={() => setRegister(true)} />
              )}
            </>
          )}
          {page === "students" && (
            <>
              <PageHead title="Students" />
              <StudentDirectory showVerify={false} />
            </>
          )}
          {page === "reports" && <GatekeeperReports />}
          {page === "settings" && <GatekeeperSettings />}
          {page === "profile" && <GatekeeperProfile />}
        </section>
      </main>
    </div>
  );
}
