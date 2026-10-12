import { useState } from "react";
import useCampus from "../hooks/useCampus.js";
import { save } from "../services/storage.js";
import { Badge, Empty, Field, PageHead } from "../components/UI.jsx";
export default function GatekeeperNotifications() {
  const { notifications, activity } = useCampus(),
    [filter, setFilter] = useState("");
  const items = notifications.length
    ? notifications
    : activity.map((a) => ({ ...a, category: a.type, detail: a.detail }));
  return (
    <>
      <PageHead title="Notifications & Alerts">
        <button
          className="btn btn-outline"
          onClick={() =>
            save(
              "cx_notifications",
              items.map((n) => ({ ...n, read: true })),
            )
          }
        >
          Mark All Read
        </button>
      </PageHead>
      <Field
        id="notification-filter"
        label="Category"
        value={filter}
        options={["", ...new Set(items.map((n) => n.category).filter(Boolean))]}
        onChange={(e) => setFilter(e.target.value)}
      />
      {items
        .filter((n) => !filter || n.category === filter)
        .map((n, index) => (
          <article className="card card-pad mt-12" key={n.id || index}>
            <Badge status={n.read ? "read" : n.level || "new"} />
            <h3>{n.title}</h3>
            <p>{n.detail}</p>
            <small>{n.time || n.createdAt}</small>
            <button
              className="btn btn-outline"
              onClick={() =>
                save(
                  "cx_notifications",
                  items.map((item) =>
                    item === n ? { ...item, read: true } : item,
                  ),
                )
              }
            >
              Mark Read
            </button>
          </article>
        ))}
      {!items.length && <Empty>No notifications yet.</Empty>}
    </>
  );
}
