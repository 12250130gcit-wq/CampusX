import { useState } from "react";
import useCampus from "../hooks/useCampus.js";
import store from "../services/store.js";
import auth from "../services/auth.js";
import { Badge, Field, Modal, PageHead, Table, useToast } from "./UI.jsx";
export default function LeaveManagement() {
  const { leaves } = useCampus(),
    toast = useToast(),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [detail, setDetail] = useState(null);
  function decide(leave, next) {
    store.decideLeave(leave.id, next, auth.getSession().name);
    toast(`Leave ${next}.`);
  }
  return (
    <>
      <PageHead
        title="Leave requests"
        description="Review applications and communicate approval decisions."
      />
      <div className="card card-pad filter-row">
        <Field
          id="leaveSearch"
          label="Search student or destination"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Field
          id="leaveStatus"
          label="Status"
          value={status}
          options={["", "pending", "approved", "rejected"]}
          onChange={(e) => setStatus(e.target.value)}
        />
      </div>
      <div className="card mt-16">
        <Table
          rows={leaves.filter(
            (l) =>
              (!status || l.status === status) &&
              `${l.studentName} ${l.studentId} ${l.destination}`
                .toLowerCase()
                .includes(query.toLowerCase()),
          )}
          columns={[
            {
              label: "Student",
              render: (l) => (
                <>
                  <strong>{l.studentName}</strong>
                  <p>{l.studentId}</p>
                </>
              ),
            },
            {
              label: "Schedule",
              render: (l) => (
                <>
                  {l.date}
                  <br />
                  {l.exitTime}–{l.returnTime}
                </>
              ),
            },
            { label: "Destination", key: "destination" },
            {
              label: "Status",
              render: (l) => (
                <>
                  <Badge status={l.status} />
                  <span className="sr-only">
                    {l.status[0].toUpperCase() + l.status.slice(1)}
                  </span>
                </>
              ),
            },
            {
              label: "Actions",
              render: (l) => (
                <div className="action-row">
                  {l.status === "pending" && (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => decide(l, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => decide(l, "rejected")}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    className="btn btn-outline"
                    onClick={() => setDetail(l)}
                  >
                    View
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>
      {detail && (
        <Modal title="Leave details" onClose={() => setDetail(null)}>
          <h3>{detail.studentName}</h3>
          <p>{detail.studentId}</p>
          <p>
            {detail.destination} · {detail.date}
          </p>
          <p>{detail.reason}</p>
          <p>
            {detail.exitTime}–{detail.returnTime}
          </p>
        </Modal>
      )}
    </>
  );
}
