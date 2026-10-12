import { useState } from "react";
import { load, save } from "../services/storage.js";
import gate from "../services/gate.js";
import { Field, PageHead, useToast } from "../components/UI.jsx";
const defaults = {
  gate: "Main Gate",
  autoLock: "5 minutes",
  visitDuration: "1 hour",
  scanSound: true,
  overdueAlerts: true,
  visitorAlerts: true,
  requireIdentity: true,
  requirePurpose: true,
  autoCheckout: false,
  confirmOverrides: true,
};
export default function GatekeeperSettings() {
  const [settings, setSettings] = useState(() => ({
      ...defaults,
      ...load("cx_gate_local_settings", {}),
    })),
    toast = useToast();
  const input = (key) => ({
    value: settings[key],
    onChange: (e) => setSettings({ ...settings, [key]: e.target.value }),
  });
  return (
    <>
      <PageHead
        title="Settings"
        description="Gate configuration and security preferences."
      />
      <form
        className="card card-pad"
        onSubmit={(e) => {
          e.preventDefault();
          save("cx_gate_local_settings", settings);
          gate.addAudit("Settings updated", "Gate configuration updated.");
          toast("Settings saved.");
        }}
      >
        <Field
          id="gate-setting"
          label="Assigned gate"
          options={["Main Gate", "Back Gate"]}
          {...input("gate")}
        />
        <Field
          id="lock-setting"
          label="Auto-lock preference"
          options={["5 minutes", "10 minutes", "Never"]}
          {...input("autoLock")}
        />
        <Field
          id="duration-setting"
          label="Default visit duration"
          options={["1 hour", "2 hours", "Half day"]}
          {...input("visitDuration")}
        />
        {[
          ["scanSound", "Scan sound"],
          ["overdueAlerts", "Overdue alerts"],
          ["visitorAlerts", "Visitor alerts"],
          ["requireIdentity", "Require visitor identity"],
          ["requirePurpose", "Require visit purpose"],
          ["autoCheckout", "Automatic checkout preference"],
          ["confirmOverrides", "Confirm manual overrides"],
        ].map(([key, label]) => (
          <label className="check-row" key={key}>
            <input
              type="checkbox"
              checked={!!settings[key]}
              onChange={(e) =>
                setSettings({ ...settings, [key]: e.target.checked })
              }
            />
            {label}
          </label>
        ))}
        <button className="btn btn-primary" type="submit">
          Save Settings
        </button>
      </form>
    </>
  );
}
