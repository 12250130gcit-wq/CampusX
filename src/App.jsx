import { lazy, Suspense, useEffect, useState } from "react";
import auth from "./services/auth.js";
import store from "./services/store.js";
import { navigate } from "./services/navigation.js";
import { Link, ToastProvider } from "./components/UI.jsx";
import GateShell from "./components/GateShell.jsx";
import loginCss from "./styles/Login.css?raw";
import studentCss from "./styles/StudentIndex.css?raw";
import gateCss from "./styles/gatekeeper.css?raw";
import adminCss from "./styles/admin.css?raw";
import commonCss from "./styles/react.css?raw";
import "./styles/root.css";
import "../assets/theme.css";
const Login = lazy(() => import("./pages/Login.jsx"));
const Student = lazy(() => import("./pages/StudentIndex.jsx"));
const Admin = lazy(() => import("./pages/SsoIndex.jsx"));
const gatePages = {
  index: lazy(() => import("./pages/GatekeeperIndex.jsx")),
  verification: lazy(() => import("./pages/GatekeeperVerification.jsx")),
  "outside-students": lazy(
    () => import("./pages/GatekeeperOutsideStudents.jsx"),
  ),
  overdue: lazy(() => import("./pages/GatekeeperOverdue.jsx")),
  "movement-logs": lazy(() => import("./pages/GatekeeperMovementLogs.jsx")),
  "visitor-register": lazy(
    () => import("./pages/GatekeeperVisitorRegister.jsx"),
  ),
  visitors: lazy(() => import("./pages/GatekeeperVisitors.jsx")),
  "leave-lookup": lazy(() => import("./pages/GatekeeperLeaveLookup.jsx")),
  students: lazy(() => import("./pages/GatekeeperStudents.jsx")),
  "event-mode": lazy(() => import("./pages/GatekeeperEventMode.jsx")),
  "manual-record": lazy(() => import("./pages/GatekeeperManualRecord.jsx")),
  notifications: lazy(() => import("./pages/GatekeeperNotifications.jsx")),
  reports: lazy(() => import("./pages/GatekeeperReports.jsx")),
  profile: lazy(() => import("./pages/GatekeeperProfile.jsx")),
  settings: lazy(() => import("./pages/GatekeeperSettings.jsx")),
};
export default function App() {
  const [url, setUrl] = useState(location.href);
  useEffect(() => {
    const update = () => setUrl(location.href);
    window.addEventListener("popstate", update);
    window.addEventListener("hashchange", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("hashchange", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  useEffect(() => {
    store.syncFromApi();
  }, []);
  const current = new URL(url),
    parts = current.pathname.split("/").filter(Boolean),
    role = ["student", "sso", "gatekeeper"].includes(parts[0])
      ? parts[0]
      : null,
    session = auth.getSession();
  const denied = role && session?.role !== role;
  const root = current.pathname === "/" || current.pathname === "/index.html";
  useEffect(() => {
    if (denied) navigate(`/index.html?denied=${role}`, true);
    else if (root && session && !current.searchParams.has("denied"))
      navigate("/" + auth.ROLE_HOME[session.role], true);
  }, [url, denied, role, root, session?.role]);
  useEffect(() => {
    document.title = `CampusX · ${role ? auth.ROLE_LABEL[role] : "Access Portal"}`;
  }, [role]);
  const page = (parts[1] || "index").replace(/\.html$/, "");
  const Page = gatePages[page];
  const styles =
    role === "student"
      ? studentCss
      : role === "sso"
        ? adminCss
        : role === "gatekeeper"
          ? gateCss
          : loginCss;
  return (
    <>
      <style>{styles}</style>
      <style>{commonCss}</style>
      <ToastProvider key={role || "login"}>
        <Suspense fallback={<p role="status">Loading CampusX…</p>}>
          {denied ? null : role === "student" ? (
            <Student />
          ) : role === "sso" ? (
            <Admin view={current.hash.slice(1) || "dashboard"} />
          ) : role === "gatekeeper" ? (
            <GateShell page={page}>
              {Page ? (
                <Page key={page} />
              ) : (
                <p>
                  Page not found.{" "}
                  <Link href="/gatekeeper/index.html">Return to dashboard</Link>
                </p>
              )}
            </GateShell>
          ) : root ? (
            <Login />
          ) : (
            <p>
              Page not found. <Link href="/">Return to login</Link>
            </p>
          )}
        </Suspense>
      </ToastProvider>
    </>
  );
}
