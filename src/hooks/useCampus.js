import { useSyncExternalStore } from "react";
import store from "../services/store.js";
import gate from "../services/gate.js";
let revision = 0;
const listeners = new Set();
function refresh() {
  revision++;
  listeners.forEach((listener) => listener());
}
window.addEventListener("cx:store-sync", refresh);
window.addEventListener("storage", refresh);
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export default function useCampus() {
  useSyncExternalStore(subscribe, () => revision);
  return {
    leaves: store.getAllLeaves(),
    students: gate.getStudents(),
    visitors: gate.getVisitors(),
    logs: gate.getLogs(),
    activity: store.getActivity(100),
    event: store.getEventMode(),
    notifications: gate.getNotifications(),
  };
}
