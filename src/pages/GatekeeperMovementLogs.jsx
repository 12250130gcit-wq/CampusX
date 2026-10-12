import { useState } from "react";
import useCampus from "../hooks/useCampus.js";
import { Badge, CsvLink, Field, PageHead, Table } from "../components/UI.jsx";
export default function GatekeeperMovementLogs() {
  const { logs } = useCampus(),
    [query, setQuery] = useState(""),
    [action, setAction] = useState(""),
    [date, setDate] = useState("");
  const rows = logs.filter(
    (r) =>
      `${r.name} ${r.id}`.toLowerCase().includes(query.toLowerCase()) &&
      (!action || r.action === action) &&
      (!date || (r.date || r.timestamp || "").startsWith(date)),
  );
  return (
    <>
      <PageHead
        title="Entry & Exit Logs"
        description="Search and export movement history."
      >
        <CsvLink
          name="campusx-movement.csv"
          rows={[
            ["Time", "Name", "ID", "Action", "Method"],
            ...rows.map((r) => [r.time, r.name, r.id, r.action, r.method]),
          ]}
        />
      </PageHead>
      <div className="card card-pad filter-row">
        <Field
          id="log-search"
          label="Search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Field
          id="log-action"
          label="Action"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          options={["", "EXIT", "ENTRY", "CHECK-IN", "CHECK-OUT"]}
        />
        <Field
          id="log-date"
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="card mt-16">
        <Table
          rows={rows}
          rowKey={(r) => r.logId}
          columns={[
            { label: "Time", key: "time" },
            { label: "Name", key: "name" },
            { label: "ID", key: "id" },
            { label: "Type", key: "type" },
            { label: "Action", render: (r) => <Badge status={r.action} /> },
            { label: "Method", key: "method" },
            { label: "Recorded by", key: "admin" },
          ]}
        />
      </div>
    </>
  );
}
