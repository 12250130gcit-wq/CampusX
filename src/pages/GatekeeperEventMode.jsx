import { useState } from "react";
import store from "../services/store.js";
import useCampus from "../hooks/useCampus.js";
import { Field, PageHead, useToast } from "../components/UI.jsx";
export default function GatekeeperEventMode() {
  const { event } = useCampus(),
    toast = useToast();
  const [form, setForm] = useState(() => ({
    ...event,
    allow: event.allow || { students: true, staff: true, visitors: true },
  }));
  const input = (key) => ({
    value: form[key] || "",
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });
  return (
    <>
      <PageHead
        title="Event / Special Access Mode"
        description="Manage temporary access rules for campus events."
      />
      <div className="card card-pad">
        <h3>{event.active ? "EVENT MODE ACTIVE" : "EVENT MODE INACTIVE"}</h3>
        <p>{event.name || "Standard gate rules apply."}</p>
      </div>
      <form
        className="card card-pad mt-16"
        onSubmit={(e) => {
          e.preventDefault();
          if (
            form.startDate &&
            form.endDate &&
            `${form.endDate}T${form.endTime || "23:59"}` <
              `${form.startDate}T${form.startTime || "00:00"}`
          ) {
            toast("End time must follow the start time.");
            return;
          }
          store.setEventMode(form);
          toast("Event settings saved.");
        }}
      >
        <Field id="e-name" label="Event name" required {...input("name")} />
        <div className="form-grid">
          {[
            ["startDate", "Start date", "date"],
            ["endDate", "End date", "date"],
            ["startTime", "Start time", "time"],
            ["endTime", "End time", "time"],
          ].map(([key, label, type]) => (
            <Field
              key={key}
              id={`e-${key}`}
              label={label}
              type={type}
              {...input(key)}
            />
          ))}
        </div>
        <Field id="e-note" label="Instructions" textarea {...input("note")} />
        {["students", "staff", "visitors"].map((key) => (
          <label className="check-row" key={key}>
            <input
              type="checkbox"
              checked={!!form.allow[key]}
              onChange={(e) =>
                setForm({
                  ...form,
                  allow: { ...form.allow, [key]: e.target.checked },
                })
              }
            />{" "}
            Allow {key}
          </label>
        ))}
        <label className="check-row">
          <input
            type="checkbox"
            checked={!!form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />{" "}
          Enable event mode
        </label>
        <button className="btn btn-primary" type="submit">
          Save Event Settings
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => {
            store.setEventMode({ ...event, active: false });
            setForm({ ...form, active: false });
            toast("Normal operating period restored.");
          }}
        >
          Disable Event Mode
        </button>
      </form>
    </>
  );
}
