import { PageHead } from "../components/UI.jsx";
import StudentDirectory from "../components/StudentDirectory.jsx";
export default function GatekeeperOutsideStudents() {
  return (
    <>
      <PageHead
        title="Students Outside Campus"
        description="Monitor students off campus and record returns."
      />
      <StudentDirectory mode="outside" />
    </>
  );
}
