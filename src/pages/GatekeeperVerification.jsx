import { useState } from "react";
import useCampus from "../hooks/useCampus.js";
import gate from "../services/gate.js";
import {
  Badge,
  Empty,
  Field,
  Modal,
  PageHead,
  useToast,
} from "../components/UI.jsx";
import CameraScanner from "../components/CameraScanner.jsx";
export default function GatekeeperVerification() {
  const { students, event } = useCampus(),
    toast = useToast();
  const [query, setQuery] = useState(""),
    [id, setId] = useState(
      () => new URLSearchParams(location.search).get("id") || "",
    ),
    [camera, setCamera] = useState(null),
    [override, setOverride] = useState(false),
    [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [note, setNote] = useState("");
  const student = students.find((s) => s.id === id),
    outside = student && ["outside", "overdue"].includes(student.status);
  const matches = query.trim()
    ? students
        .filter((s) =>
          `${s.name} ${s.id} ${s.cid || ""}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
        )
        .slice(0, 10)
    : [];
  function select(s) {
    setId(s.id);
    setCamera(null);
    gate.addAudit(
      "Student verified",
      `${s.name} (${s.id}) looked up at the gate.`,
    );
  }
  function scan(value) {
    const q = value.trim().toLowerCase();
    const match = students.find((s) =>
      [s.id, s.cid]
        .filter(Boolean)
        .some(
          (field) =>
            q === String(field).toLowerCase() ||
            q.includes(String(field).toLowerCase()),
        ),
    );
    if (match) {
      select(match);
      toast("Student identified.");
      return true;
    }
    return false;
  }
  function record(action, overrideNote) {
    if (action === "exit")
      gate.recordExit(
        id,
        overrideNote || note,
        overrideNote ? "Manual Override" : "QR",
      );
    else gate.recordReturn(id, note);
    setNote("");
    toast(action === "exit" ? "Exit recorded." : "Return recorded.");
  }
  return (
    <>
      <PageHead
        title="Student Verification"
        description="Scan a student ID or search the roster to verify permission."
      />
      <div className="grid-2">
        <section className="card card-pad">
          <h3>Identify student</h3>
          <div className="action-row">
            <button className="btn btn-primary" onClick={() => setCamera("qr")}>
              Scan QR / Card
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setCamera("face")}
            >
              Face Match
            </button>
          </div>
          {camera && (
            <CameraScanner
              mode={camera}
              onScan={scan}
              onClose={() => setCamera(null)}
            />
          )}
          <Field
            id="search-input"
            type="search"
            label="Search student name or ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div id="search-results">
            {matches.map((s) => (
              <button
                className="movement-row react-result"
                key={s.id}
                onClick={() => select(s)}
              >
                <strong>{s.name}</strong>
                <span>
                  {s.id} · {s.program}
                </span>
                <Badge status={s.status} />
              </button>
            ))}
            {query && !matches.length && <Empty>No match found.</Empty>}
          </div>
        </section>
        <section className="card card-pad">
          {student ? (
            <>
              <h2>{student.name}</h2>
              <p>
                {student.id} · {student.program}
              </p>
              <p>
                {student.hostel}, Room {student.room}
              </p>
              <p>Contact: {student.contact}</p>
              <p>Identity: {student.cid || "Not provided"}</p>
              <Badge status={student.status} />
              <hr />
              <h3>
                {outside
                  ? "Currently outside campus"
                  : student.leave === "approved"
                    ? "Approved leave"
                    : "No approved leave"}
              </h3>
              <p>Destination: {student.destination}</p>
              <p>
                Exit: {student.exitTime} · Expected return:{" "}
                {student.expectedReturn}
              </p>
              <p>Approved by: {student.approvedBy}</p>
              <Badge status={student.leave} />
              {event.active && (
                <p>
                  Event Mode: {event.name}. Confirm event access rules before
                  recording movement.
                </p>
              )}
              <Field
                id="movement-note"
                label="Movement note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="action-row">
                {outside ? (
                  <button
                    className="btn btn-success"
                    onClick={() => record("return")}
                  >
                    Record Return
                  </button>
                ) : student.leave === "approved" ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => record("exit")}
                  >
                    Record Exit
                  </button>
                ) : (
                  <button
                    className="btn btn-danger"
                    onClick={() => setOverride(true)}
                  >
                    Manual Override
                  </button>
                )}
              </div>
            </>
          ) : (
            <Empty>Search or scan a student to begin verification.</Empty>
          )}
        </section>
      </div>
      {override && student && (
        <Modal title="Manual Override" onClose={() => setOverride(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              record("exit", reason);
              gate.addAudit("Manual override", `${student.name}: ${reason}`);
              setOverride(false);
              setReason("");
              setConfirmed(false);
            }}
          >
            <Field
              id="override-reason"
              textarea
              label="Override reason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <label>
              <input
                type="checkbox"
                required
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />{" "}
              I confirm this override and accept responsibility for the audit
              entry.
            </label>
            <button className="btn btn-danger" type="submit">
              Confirm Override
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
