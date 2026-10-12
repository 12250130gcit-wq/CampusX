import { useState } from "react";
import useCampus from "../hooks/useCampus.js";
import gate from "../services/gate.js";
import {
  Badge,
  Field,
  Link,
  Modal,
  PageHead,
  Table,
  useToast,
} from "../components/UI.jsx";
export default function GatekeeperVisitors({ onRegister }) {
  const { visitors } = useCampus(),
    toast = useToast(),
    [query, setQuery] = useState(""),
    [history, setHistory] = useState(location.hash === "#history"),
    [detail, setDetail] = useState(null);
  const rows = visitors.filter(
    (v) =>
      (history || v.status === "inside") &&
      `${v.name} ${v.id} ${v.visiting}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHead
        title="Visitor Directory"
        description="Manage visitors on campus and view visit history."
      >
        {onRegister ? (
          <button className="btn btn-primary" onClick={onRegister}>
            Register Visitor
          </button>
        ) : (
          <Link
            className="btn btn-primary"
            href="/gatekeeper/visitor-register.html"
          >
            Register Visitor
          </Link>
        )}
      </PageHead>
      <div className="card card-pad">
        <Field
          id="visitor-search"
          type="search"
          label="Search visitors"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label>
          <input
            type="checkbox"
            checked={history}
            onChange={(e) => setHistory(e.target.checked)}
          />{" "}
          Include checked-out visitors
        </label>
      </div>
      <div className="card mt-16">
        <Table
          rows={rows}
          columns={[
            { label: "Visitor", key: "name" },
            { label: "Visiting", key: "visiting" },
            { label: "Check-in", key: "checkIn" },
            { label: "Status", render: (v) => <Badge status={v.status} /> },
            {
              label: "Actions",
              render: (v) => (
                <div className="action-row">
                  <button
                    className="btn btn-outline"
                    onClick={() => setDetail(v)}
                  >
                    View
                  </button>
                  {v.status === "inside" && (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        gate.checkOutVisitor(v.id);
                        toast("Visitor checked out.");
                      }}
                    >
                      Check Out
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
            {detail.id} · {detail.relationship}
          </p>
          <p>Contact: {detail.contact}</p>
          <p>Visiting: {detail.visiting}</p>
          <p>Purpose: {detail.purpose}</p>
          <p>Checked out: {detail.checkOut || "Still inside"}</p>
        </Modal>
      )}
    </>
  );
}
