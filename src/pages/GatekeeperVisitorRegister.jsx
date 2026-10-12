import { useState } from "react";
import gate from "../services/gate.js";
import { Field, PageHead, useToast } from "../components/UI.jsx";
export default function GatekeeperVisitorRegister() {
  const toast = useToast(),
    [record, setRecord] = useState(null);
  const initial = {
    name: "",
    contact: "",
    cid: "",
    visiting: "",
    visitingId: "",
    relationship: "Parent",
    expectedOut: "1 hour",
    purpose: "",
  };
  const [form, setForm] = useState(initial);
  const input = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });
  return (
    <>
      <PageHead
        title="Register Visitor"
        description="Verify visitor details and issue a gate pass."
      />
      <div className="grid-2">
        <form
          id="visitor-form"
          className="card card-pad"
          onSubmit={(e) => {
            e.preventDefault();
            setRecord(gate.registerVisitor(form));
            setForm(initial);
            toast("Visitor registered successfully.");
          }}
        >
          {[
            ["name", "Visitor name"],
            ["contact", "Phone number"],
            ["cid", "Identity number"],
            ["visiting", "Student being visited"],
            ["visitingId", "Student ID"],
          ].map(([key, label]) => (
            <Field
              key={key}
              id={`v-${key}`}
              label={label}
              required={key !== "visitingId"}
              {...input(key)}
            />
          ))}
          <Field
            id="v-relationship"
            label="Relationship"
            options={["Parent", "Guardian", "Sibling", "Friend", "Other"]}
            {...input("relationship")}
          />
          <Field
            id="v-duration"
            label="Expected duration"
            options={["1 hour", "2 hours", "Half day"]}
            {...input("expectedOut")}
          />
          <Field
            id="v-purpose"
            label="Purpose"
            textarea
            required
            {...input("purpose")}
          />
          <button type="submit" className="btn btn-primary">
            Register & Issue Pass
          </button>
        </form>
        <section className="card card-pad">
          <h3>Visitor Pass</h3>
          {record ? (
            <>
              <h2>{record.name}</h2>
              <p>{record.id}</p>
              <p>
                {record.relationship} · Visiting {record.visiting}
              </p>
              <p>Check-in: {record.checkIn}</p>
              <p>Expected duration: {record.expectedOut}</p>
              <button
                className="btn btn-outline"
                onClick={() => window.print()}
              >
                Print Pass
              </button>
            </>
          ) : (
            <p>Register a visitor to generate their pass.</p>
          )}
        </section>
      </div>
    </>
  );
}
