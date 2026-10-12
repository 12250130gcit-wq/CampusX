import { PageHead } from "../components/UI.jsx";
import StudentDirectory from "../components/StudentDirectory.jsx";
export default function GatekeeperOverdue() {
  return (
    <>
      <PageHead
        title="Overdue Students"
        description="Follow up on students who have not returned."
      />
      <StudentDirectory mode="overdue" />
    </>
  );
}
