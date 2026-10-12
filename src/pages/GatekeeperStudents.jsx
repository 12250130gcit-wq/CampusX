import { PageHead } from "../components/UI.jsx";
import StudentDirectory from "../components/StudentDirectory.jsx";
export default function GatekeeperStudents() {
  return (
    <>
      <PageHead
        title="Student Directory"
        description="Search the student roster and view campus status."
      />
      <StudentDirectory />
    </>
  );
}
