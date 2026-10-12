import { useState } from "react";
import auth from "../services/auth.js";
import { load, save } from "../services/storage.js";
import gate from "../services/gate.js";
import { Field, PageHead, useToast } from "../components/UI.jsx";
export default function GatekeeperProfile() {
  const session = auth.getSession(),
    toast = useToast(),
    [form, setForm] = useState(() =>
      load(`campusx_staff_profile_${session.id}`, {
        name: session.name,
        email: session.email || "",
        phone: "",
        gate: "Main Gate",
        shift: "8:00 AM – 4:00 PM",
      }),
    );
  return (
    <>
      <PageHead
        title="My Profile"
        description={`${session.id} · ${auth.ROLE_LABEL[session.role]}`}
      />
      <form
        className="card card-pad"
        onSubmit={(e) => {
          e.preventDefault();
          save(`campusx_staff_profile_${session.id}`, form);
          gate.addAudit(
            "Profile updated",
            `${session.name} updated their contact details.`,
          );
          toast("Profile saved.");
        }}
      >
        {Object.entries(form).map(([key, value]) => (
          <Field
            key={key}
            id={`staff-${key}`}
            label={key}
            value={value}
            required={key === "name"}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        ))}
        <button className="btn btn-primary" type="submit">
          Save Changes
        </button>
        <button
          className="btn btn-outline"
          type="button"
          onClick={() => auth.logout()}
        >
          Log Out
        </button>
      </form>
    </>
  );
}
