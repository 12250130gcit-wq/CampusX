import { useEffect, useMemo, useState } from "react";
import CXStore from "../services/store.js";
import CxData from "../services/gate.js";
import { initials as cxInitials } from "../services/gate.js";

const statusLabels = {
  approved: "APPROVED",
  pending: "PENDING",
  rejected: "REJECTED",
  rejected_recent: "REJECTED",
  expired: "EXPIRED",
  none: "NO ACTIVE PERMISSION",
};

function leaveTone(status) {
  if (status === "approved") return "ok";
  if (status === "pending") return "warn";
  return "no";
}

function leaveLabel(status) {
  return statusLabels[status] || String(status || "").toUpperCase();
}

function matchesQuery(value, query) {
  return String(value || "")
    .toLowerCase()
    .includes(query);
}

function LeaveCard({ leave, student, live }) {
  const status = live ? leave.status : student.leave;
  const tone = leaveTone(status);
  const name = live ? leave.studentName : student.name;
  const id = live ? leave.studentId : student.id;
  const destination = live ? leave.destination : student.destination;
  const reason = live ? leave.reason : student.approvedBy;
  const exit = live ? leave.exitTime : student.exitTime;
  const returnTime = live ? leave.returnTime : student.expectedReturn;
  const approvedBy = live
    ? leave.decidedBy || "Awaiting approval"
    : student.approvedBy;

  return (
    <article className="card card-pad mt-12">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-12">
          <div className="person-avatar">
            {live ? cxInitials(name) : student.initials}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "14.5px" }}>{name}</div>
            <div className="text-muted text-sm">
              #{id} · {live ? "Submitted via Student App" : student.program}
            </div>
          </div>
        </div>
        <span
          className={`badge ${tone === "ok" ? "badge-approved" : tone === "warn" ? "badge-pending" : "badge-rejected"}`}
        >
          {leaveLabel(status)}
        </span>
      </div>
      <div className="kv-grid">
        <div className="kv">
          <div className="k">Destination</div>
          <div className="v">{destination || "—"}</div>
        </div>
        <div className="kv">
          <div className="k">{live ? "Reason" : "Approved By"}</div>
          <div className="v">{reason || "—"}</div>
        </div>
        <div className="kv">
          <div className="k">Exit {live ? "" : "Window"}</div>
          <div className="v mono">{exit || "—"}</div>
        </div>
        <div className="kv">
          <div className="k">Expected Return</div>
          <div className="v mono">{returnTime || "—"}</div>
        </div>
      </div>
      <div className={`verdict-banner ${tone === "ok" ? "ok" : "no"} mt-16`}>
        <div className="icon">
          <span aria-hidden="true">{tone === "ok" ? "✓" : "×"}</span>
        </div>
        <div>
          <div className="title">
            {tone === "ok"
              ? "Permission valid for gate exit"
              : tone === "warn"
                ? "Awaiting SSO / warden decision"
                : "No valid permission for exit"}
          </div>
          <div className="sub">
            {live
              ? "Submitted from the Student portal."
              : `Status: ${approvedBy}.`}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function LeaveLookup() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener("cx:store-sync", refresh);
    return () => window.removeEventListener("cx:store-sync", refresh);
  }, []);

  const results = useMemo(() => {
    const q = submittedQuery.trim().toLowerCase();
    if (!q) return { live: [], students: [] };
    const live = CXStore.getAllLeaves().filter(
      (leave) =>
        matchesQuery(leave.studentId, q) || matchesQuery(leave.studentName, q),
    );
    const students = live.length
      ? []
      : CxData.getStudents().filter(
          (student) =>
            matchesQuery(student.id, q) || matchesQuery(student.name, q),
        );
    return { live, students };
  }, [submittedQuery, revision]);

  function lookup(event) {
    event.preventDefault();
    const nextQuery = query.trim();
    setSubmittedQuery(nextQuery);
    if (nextQuery)
      CxData.addAudit(
        "Leave lookup",
        `Leave record checked for query "${nextQuery}".`,
      );
  }

  const hasQuery = submittedQuery.trim().length > 0;
  const hasResults = results.live.length > 0 || results.students.length > 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Leave / Permission Lookup</h2>
          <p className="desc">
            Look up the leave permission an SSO or Warden has already approved.
            Gatekeepers verify - they do not approve leave.
          </p>
        </div>
      </div>

      <form className="card card-pad" onSubmit={lookup}>
        <div className="search-row" style={{ marginBottom: 0 }}>
          <div className="search-box">
            <span data-icon="search"></span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              placeholder="Search by student name or student ID..."
              aria-label="Search by student name or student ID"
            />
          </div>
          <button className="btn btn-dark" type="submit">
            Look Up
          </button>
        </div>
      </form>

      <section className="section mt-16" aria-live="polite">
        {hasQuery && !hasResults && (
          <div className="card empty-state">
            <div className="t">No leave record found</div>
            <div className="d">
              Check the spelling or student ID and try again.
            </div>
          </div>
        )}
        {results.live.map((leave) => (
          <LeaveCard key={leave.id} leave={leave} live />
        ))}
        {results.students.map((student) => (
          <LeaveCard key={student.id} student={student} />
        ))}
      </section>
    </>
  );
}
