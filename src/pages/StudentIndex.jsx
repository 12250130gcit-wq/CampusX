import { useState } from "react";
import auth from "../services/auth.js";
import store from "../services/store.js";
import { load, save } from "../services/storage.js";
import useCampus from "../hooks/useCampus.js";
import { Badge, Empty, Field, Modal, useToast } from "../components/UI.jsx";
const today = () => new Date().toLocaleDateString("en-CA");
export default function StudentIndex() {
  const student = auth.getSession(),
    { leaves, activity } = useCampus(),
    toast = useToast();
  const [view, setView] = useState("home"),
    [filter, setFilter] = useState("all"),
    [notification, setNotification] = useState(false),
    [detail, setDetail] = useState(null),
    [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(() =>
    load(`campusx_profile_${student.id}`, {
      name: student.name,
      department: "Not provided",
      year: "Not provided",
      guardian: "Not provided",
    }),
  );
  const defaults = () => ({
    date: today(),
    exitTime: "17:00",
    returnTime: "20:00",
    destination: "",
    reason: "",
  });
  const [form, setForm] = useState(defaults),
    [attachment, setAttachment] = useState(null);
  const mine = leaves.filter((leave) => leave.studentId === student.id),
    current = mine.find((leave) =>
      ["pending", "approved"].includes(leave.status),
    );
  const input = (key) => ({
    value: form[key],
    onChange: (event) => setForm({ ...form, [key]: event.target.value }),
  });
  function submit(event) {
    event.preventDefault();
    if (form.returnTime <= form.exitTime) {
      toast("Choose a return time later than the exit time.");
      return;
    }
    store.addLeave(student.id, student.name, {
      ...form,
      purpose: form.reason,
      dateLabel: form.date,
      attachmentName: attachment?.name,
    });
    setForm(defaults());
    setAttachment(null);
    setView("home");
    toast("Leave application submitted for SSO review.");
  }
  function ticket(leave) {
    return (
      <article className="ticket" key={leave.id}>
        <strong>{leave.destination}</strong>
        <span>
          {leave.date} · {leave.exitTime}–{leave.returnTime}
        </span>
        <p>{leave.reason}</p>
        <Badge status={leave.status} />
        <button className="btn btn-outline" onClick={() => setDetail(leave)}>
          View details
        </button>
      </article>
    );
  }
  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <strong>CampusX</strong>
          <span>GCIT · PORTAL</span>
        </div>
        <button
          className="icon-btn"
          id="bellBtn"
          title="Notifications"
          onClick={() => setNotification(!notification)}
        >
          ♧
        </button>
      </div>
      <div className="greeting">
        <h1 id="helloName">Hello, {student.name.split(" ")[0]}</h1>
        <p id="helloSid">Student ID {student.id}</p>
      </div>
      {notification && (
        <div className="notif-panel show">
          <strong>Notifications</strong>
          {activity
            .filter(
              (a) =>
                a.actor === student.name || a.detail?.includes(student.name),
            )
            .slice(0, 5)
            .map((a) => (
              <p key={a.id}>
                {a.title}: {a.detail}
              </p>
            ))}
        </div>
      )}
      <div className="screens">
        <section
          id="view-home"
          className={`screen ${view === "home" ? "active" : ""}`}
          hidden={view !== "home"}
        >
          <div className="status-card">
            <Badge status={current?.status || "inside"} />
            <h2 id="statusLabel">
              {current ? current.status.toUpperCase() : "ON CAMPUS"}
            </h2>
            <p>
              {current
                ? `${current.destination} · ${current.date}`
                : "No active leave today."}
            </p>
            <button
              className="btn btn-primary"
              id="applyBtnHome"
              onClick={() => setView("apply")}
            >
              Apply for Leave
            </button>
          </div>
          <div className="section-title">Upcoming leave</div>
          <div id="upcomingBox">
            {current ? ticket(current) : <Empty>No upcoming leave.</Empty>}
          </div>
          <div className="section-title">
            Recent Activity{" "}
            <button className="see-all" onClick={() => setView("myleaves")}>
              View All →
            </button>
          </div>
          <div id="activityList">
            {activity
              .filter(
                (a) =>
                  a.actor === student.name || a.detail?.includes(student.name),
              )
              .slice(0, 8)
              .map((a) => (
                <div className="activity-item" key={a.id}>
                  <strong>{a.title}</strong>
                  <p>{a.detail}</p>
                </div>
              ))}
          </div>
        </section>
        <section
          id="view-apply"
          className={`screen ${view === "apply" ? "active" : ""}`}
          hidden={view !== "apply"}
        >
          <h2>Apply for Leave</h2>
          <form id="leaveForm" onSubmit={submit}>
            <Field
              label="Date"
              id="fDate"
              type="date"
              required
              min={today()}
              {...input("date")}
            />
            <div className="form-grid">
              <Field
                label="Exit time"
                id="fExit"
                type="time"
                required
                {...input("exitTime")}
              />
              <Field
                label="Return time"
                id="fReturn"
                type="time"
                required
                {...input("returnTime")}
              />
            </div>
            <Field
              label="Destination"
              id="fDest"
              required
              options={[
                "",
                "Gyalpozhing Market",
                "Thimphu Town",
                "Library Research (off-campus)",
                "Family Visit",
                "Medical Appointment",
                "Other",
              ]}
              {...input("destination")}
            />
            <Field
              label="Reason"
              id="fReason"
              textarea
              required
              {...input("reason")}
            />
            <Field
              label="Supporting document (local selection)"
              id="fileInput"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setAttachment(e.target.files[0] || null)}
            />
            {attachment && <p>{attachment.name}</p>}
            <button className="btn btn-primary" type="submit">
              Submit Leave Request
            </button>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => setView("home")}
            >
              Cancel
            </button>
          </form>
        </section>
        <section
          id="view-myleaves"
          className={`screen ${view === "myleaves" ? "active" : ""}`}
          hidden={view !== "myleaves"}
        >
          <h2>My Leaves</h2>
          <div className="chip-row">
            {["all", "pending", "approved", "rejected"].map((value) => (
              <button
                key={value}
                className={`chip ${filter === value ? "active" : ""}`}
                onClick={() => setFilter(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <div id="myLeavesList">
            {mine
              .filter((leave) => filter === "all" || leave.status === filter)
              .map(ticket)}
            {!mine.length && <Empty>No leave applications yet.</Empty>}
          </div>
        </section>
        <section
          id="view-profile"
          className={`screen ${view === "profile" ? "active" : ""}`}
          hidden={view !== "profile"}
        >
          <h2 id="pName">{profile.name}</h2>
          <p>{student.id} · GCIT</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              save(`campusx_profile_${student.id}`, profile);
              setEditing(false);
              toast("Profile saved.");
            }}
          >
            {Object.entries(profile).map(([key, value]) => (
              <Field
                key={key}
                id={`profile-${key}`}
                label={key}
                value={value}
                disabled={!editing}
                onChange={(e) =>
                  setProfile({ ...profile, [key]: e.target.value })
                }
              />
            ))}
            {editing ? (
              <button className="btn btn-primary" type="submit">
                Save Changes
              </button>
            ) : (
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </button>
            )}
          </form>
          <button
            className="btn btn-outline"
            id="logoutBtn"
            onClick={() => auth.logout()}
          >
            Log Out
          </button>
        </section>
      </div>
      <nav className="bottom-nav">
        {[
          ["home", "Home"],
          ["apply", "Apply"],
          ["myleaves", "My Leaves"],
          ["profile", "Profile"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`nav-item ${view === key ? "active" : ""}`}
            data-view={key}
            onClick={() => setView(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      {detail && (
        <Modal title="Leave details" onClose={() => setDetail(null)}>
          {ticket(detail)}
          <p>Approved by: {detail.decidedBy || "Awaiting approval"}</p>
        </Modal>
      )}
    </div>
  );
}
