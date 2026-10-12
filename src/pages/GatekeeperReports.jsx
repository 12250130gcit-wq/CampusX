import useCampus from "../hooks/useCampus.js";
import gate from "../services/gate.js";
import { CsvLink, PageHead, Stats, Table } from "../components/UI.jsx";
export default function GatekeeperReports() {
  const { logs, visitors, students } = useCampus();
  const metrics = [
    ["Total exits", logs.filter((r) => r.action === "EXIT").length],
    ["Total entries", logs.filter((r) => r.action === "ENTRY").length],
    ["Visitors", visitors.length],
    ["Overdue students", students.filter((s) => s.status === "overdue").length],
  ];
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const date = d.toLocaleDateString("en-CA");
    return {
      date,
      label: d.toLocaleDateString("en", { weekday: "short" }),
      count: logs.filter((r) => (r.date || r.timestamp || "").startsWith(date))
        .length,
    };
  });
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <>
      <PageHead
        title="Reports & Analytics"
        description="Campus movement totals and audit history."
      >
        <CsvLink
          rows={[["Metric", "Value"], ...metrics]}
          onClick={() =>
            gate.addAudit(
              "Report exported",
              "Campus movement summary exported.",
            )
          }
          name="campusx-report.csv"
        />
      </PageHead>
      <Stats items={metrics} />
      <div className="card card-pad">
        <h3>Movement over the last 7 days</h3>
        <div className="react-chart">
          {days.map((day) => (
            <div key={day.date}>
              <span>{day.count}</span>
              <div
                className="react-bar"
                style={{ height: Math.max(2, (day.count / max) * 140) }}
                title={`${day.date}: ${day.count}`}
              />
              <small>{day.label}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="card mt-16">
        <h3>Audit trail</h3>
        <Table
          rows={gate.getAudit()}
          columns={[
            { label: "Time", key: "time" },
            { label: "Action", key: "title" },
            { label: "Details", key: "detail" },
            { label: "Recorded by", key: "actor" },
          ]}
        />
      </div>
    </>
  );
}
