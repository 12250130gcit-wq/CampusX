import useCampus from "../hooks/useCampus.js";
import auth from "../services/auth.js";
import { Badge, PageHead, Stats, Table, Link } from "../components/UI.jsx";
export default function GatekeeperIndex() {
  const { students, visitors, logs, event } = useCampus();
  return (
    <>
      <PageHead
        title={`Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${auth.getSession().name.split(" ")[0]}`}
        description="Main Gate · Campus movement overview"
      >
        <Link className="btn btn-primary" href="/gatekeeper/verification.html">
          Scan Student ID
        </Link>
      </PageHead>
      <Stats
        items={[
          [
            "Students Outside",
            students.filter((s) => ["outside", "overdue"].includes(s.status))
              .length,
          ],
          ["Overdue", students.filter((s) => s.status === "overdue").length],
          [
            "Visitors Inside",
            visitors.filter((v) => v.status === "inside").length,
          ],
          ["Movement Records", logs.length],
        ]}
      />
      <div className="card card-pad">
        <h3>
          {event.active ? "Event Mode active" : "Normal operating period"}
        </h3>
        <p>{event.name || "Standard gate rules apply."}</p>
        <Link href="/gatekeeper/event-mode.html">Manage event mode</Link>
      </div>
      <section className="card mt-16">
        <div className="card-head">
          <h3>Recent movement</h3>
          <Link href="/gatekeeper/movement-logs.html">View all</Link>
        </div>
        <Table
          rows={logs.slice(0, 10)}
          rowKey={(r) => r.logId}
          columns={[
            { label: "Student / Visitor", key: "name" },
            { label: "ID", key: "id" },
            { label: "Time", key: "time" },
            { label: "Action", render: (r) => <Badge status={r.action} /> },
          ]}
        />
      </section>
    </>
  );
}
