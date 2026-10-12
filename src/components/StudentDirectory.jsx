import { useState } from "react";
import useCampus from "../hooks/useCampus.js";
import gate from "../services/gate.js";
import { Badge, Field, Modal, Table, Link, useToast } from "./UI.jsx";
export default function StudentDirectory({ mode = "all", showVerify = true }) {
  const { students } = useCampus(),
    toast = useToast();
  const [query, setQuery] = useState(""),
    [program, setProgram] = useState(""),
    [detail, setDetail] = useState(null),
    [followup, setFollowup] = useState(null),
    [note, setNote] = useState("");
  const rows = students.filter(
    (s) =>
      (mode === "all" ||
        (mode === "outside"
          ? ["outside", "overdue"].includes(s.status)
          : s.status === mode)) &&
      `${s.name} ${s.id}`.toLowerCase().includes(query.toLowerCase()) &&
      (!program || s.program === program),
  );
  return (
    <>
      <div className="card card-pad filter-row">
        <Field
          id="student-search"
          label="Search students"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Field
          id="program-filter"
          label="Programme"
          value={program}
          options={[
            "",
            ...new Set(students.map((s) => s.program).filter(Boolean)),
          ]}
          onChange={(e) => setProgram(e.target.value)}
        />
      </div>
      <div className="card mt-16">
        <Table
          rows={rows}
          columns={[
            {
              label: "Student",
              render: (s) => (
                <>
                  <strong>{s.name}</strong>
                  <div>{s.id}</div>
                </>
              ),
            },
            { label: "Programme", key: "program" },
            { label: "Hostel", key: "hostel" },
            { label: "Status", render: (s) => <Badge status={s.status} /> },
            { label: "Expected return", key: "expectedReturn" },
            {
              label: "Actions",
              render: (s) => (
                <div className="action-row">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setDetail(s)}
                  >
                    View
                  </button>
                  {["outside", "overdue"].includes(s.status) && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => {
                        gate.recordReturn(s.id);
                        toast("Return recorded.");
                      }}
                    >
                      Return
                    </button>
                  )}
                  {mode === "overdue" && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setFollowup(s)}
                    >
                      Follow-Up
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <p>
            {detail.id} · {detail.program}
          </p>
          <p>
            {detail.hostel} · Room {detail.room}
          </p>
          <p>Contact: {detail.contact}</p>
          <p>Destination: {detail.destination}</p>
          <Badge status={detail.leave} />
          {showVerify && (
            <Link
              className="btn btn-primary"
              href={`/gatekeeper/verification.html?id=${encodeURIComponent(detail.id)}`}
            >
              Verify student
            </Link>
          )}
        </Modal>
      )}
      {followup && (
        <Modal
          title={`Follow up: ${followup.name}`}
          onClose={() => setFollowup(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              gate.addAudit("Overdue follow-up", `${followup.name}: ${note}`);
              setFollowup(null);
              setNote("");
              toast("Follow-up saved.");
            }}
          >
            <Field
              id="followup-note"
              label="Follow-up note"
              textarea
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              Save follow-up
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
