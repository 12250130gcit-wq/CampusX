import { useState } from "react";
import gate from "../services/gate.js";
import { Field, PageHead, useToast } from "../components/UI.jsx";
const defaults = () => ({
  name: "",
  studentId: "",
  type: "ENTRY",
  date: new Date().toLocaleDateString("en-CA"),
  time: new Date().toTimeString().slice(0, 5),
  method: "Manual",
  reason: "",
  confirmed: false,
});
export default function GatekeeperManualRecord() {
  const [form, setForm] = useState(defaults),
    toast = useToast();
  const input = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });
  return (
    <>
      <PageHead
        title="Manual Entry / Exit"
        description="Record movements when scanning is unavailable."
      />
      <form
        id="manual-form"
        className="card card-pad"
        onSubmit={(e) => {
          e.preventDefault();
          gate.addManualRecord(form);
          setForm(defaults());
          toast("Manual record saved and logged for audit.");
        }}
      >
        <div className="form-grid">
          <Field
            id="m-student"
            label="Student name"
            required
            {...input("name")}
          />
          <Field
            id="m-id"
            label="Student ID"
            required
            {...input("studentId")}
          />
          <Field
            id="m-type"
            label="Movement"
            options={["ENTRY", "EXIT"]}
            {...input("type")}
          />
          <Field
            id="m-date"
            label="Date"
            type="date"
            required
            {...input("date")}
          />
          <Field
            id="m-time"
            label="Time"
            type="time"
            required
            {...input("time")}
          />
          <Field
            id="m-method"
            label="Verification method"
            options={["Manual", "ID Card", "Phone Confirmation"]}
            {...input("method")}
          />
        </div>
        <Field
          id="m-reason"
          label="Reason for manual record"
          textarea
          required
          {...input("reason")}
        />
        <label>
          <input
            id="m-confirm"
            type="checkbox"
            required
            checked={form.confirmed}
            onChange={(e) => setForm({ ...form, confirmed: e.target.checked })}
          />{" "}
          I confirm this record is accurate.
        </label>
        <button className="btn btn-primary" type="submit">
          Save Record
        </button>
      </form>
    </>
  );
}
