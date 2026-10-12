import { useState } from "react";
import auth from "../services/auth.js";
import { useToast } from "../components/UI.jsx";
import logo from "../../assets/gcit-logo.png";
const roles = {
  student: ["Student", "STU-2024-014", "student123"],
  sso: ["SSO Admin", "ADM-SSO-001", "sso@admin123"],
  gatekeeper: ["Gatekeeper", "GK-001", "gate@2024"],
};
export default function Login() {
  const denied = new URLSearchParams(location.search).get("denied");
  const [role, setRole] = useState(roles[denied] ? denied : "student"),
    [tab, setTab] = useState("login"),
    [form, setForm] = useState({
      id: "",
      password: "",
      name: "",
      email: "",
      confirm: "",
    }),
    [error, setError] = useState(""),
    [show, setShow] = useState(false);
  const toast = useToast();
  const input = (key) => ({
    value: form[key],
    onChange: (e) => {
      setForm({ ...form, [key]: e.target.value });
      setError("");
    },
  });
  function submit(event) {
    event.preventDefault();
    setError("");
    if (
      tab === "register" &&
      (form.password.length < 8 || form.password !== form.confirm)
    ) {
      setError("Use at least 8 characters and matching passwords.");
      return;
    }
    const result =
      tab === "login"
        ? auth.login(role, form.id, form.password)
        : auth.register(role, form);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (tab === "login") auth.goToRoleHome(role);
    else {
      setTab("login");
      setForm({ ...form, password: "", confirm: "" });
      toast("Account created — please log in.");
    }
  }
  return (
    <div className="wrap">
      <div className="brand">
        <img src={logo} alt="GCIT logo" />
        <div className="name">
          <strong>CampusX</strong>
          <span>Gyalpozhing College of Information Technology</span>
        </div>
      </div>
      <div className="card">
        <div className="role-select" id="roleSelect">
          {Object.entries(roles).map(([key, [name]]) => (
            <button
              key={key}
              type="button"
              className={`role-btn ${role === key ? "active" : ""}`}
              data-role={key}
              onClick={() => {
                setRole(key);
                setError("");
              }}
            >
              <span className="rb-label">{name}</span>
            </button>
          ))}
        </div>
        <div className="role-note">
          {denied
            ? `Please log in as ${roles[role][0]} to continue.`
            : "Three separate, interlinked accounts — one login screen."}
        </div>
        <div className="heading">
          <h2>
            {tab === "login"
              ? "Welcome back"
              : `Create your ${roles[role][0]} account`}
          </h2>
          <p>
            {tab === "login"
              ? `Log in with your ${roles[role][0]} ID.`
              : "Register your campus account."}
          </p>
        </div>
        <div
          id="tabs"
          className={`tabs ${tab === "register" ? "reg-active" : ""}`}
        >
          <span className="tab-indicator" />
          {["login", "register"].map((value) => (
            <button
              type="button"
              key={value}
              className={tab === value ? "active" : ""}
              data-target={value}
              onClick={() => {
                setTab(value);
                setError("");
              }}
            >
              {value === "login" ? "Log In" : "Register"}
            </button>
          ))}
        </div>
        {tab === "login" && (
          <div className="demo-hint">
            Demo ID <b>{roles[role][1]}</b> · password <b>{roles[role][2]}</b>
          </div>
        )}
        <form
          id={tab === "login" ? "loginForm" : "registerForm"}
          className="active"
          onSubmit={submit}
        >
          {tab === "register" && (
            <div className="field">
              <label htmlFor="rg-name">Full name</label>
              <input
                id="rg-name"
                required
                autoComplete="name"
                {...input("name")}
              />
            </div>
          )}
          <div className="field">
            <label htmlFor={tab === "login" ? "lg-id" : "rg-id"}>
              Account ID
            </label>
            <input
              id={tab === "login" ? "lg-id" : "rg-id"}
              required
              autoComplete="username"
              {...input("id")}
            />
          </div>
          {tab === "register" && (
            <div className="field">
              <label htmlFor="rg-email">College email</label>
              <input
                id="rg-email"
                type="email"
                required
                placeholder="12250129gcit@rub.edu.bt"
                {...input("email")}
              />
            </div>
          )}
          <div className="field">
            <label htmlFor={tab === "login" ? "lg-pw" : "rg-pw"}>
              Password
            </label>
            <div className="input-wrap">
              <input
                id={tab === "login" ? "lg-pw" : "rg-pw"}
                required
                type={show ? "text" : "password"}
                autoComplete={
                  tab === "login" ? "current-password" : "new-password"
                }
                {...input("password")}
              />
              <button
                type="button"
                className="pw-toggle"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow(!show)}
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {tab === "register" && (
            <div className="field">
              <label htmlFor="rg-cpw">Confirm password</label>
              <input
                id="rg-cpw"
                required
                type="password"
                {...input("confirm")}
              />
            </div>
          )}
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button className="submit-btn" type="submit">
            {tab === "login" ? "Log In" : "Create Account"}
          </button>
        </form>
      </div>
      <p className="footer-note">CampusX · GCIT Unified Portal</p>
    </div>
  );
}
