import { RequirePermission } from "@/components/coach/require-permission";
import { TeamScreen } from "./team-screen";

export default function Page() {
  return (
    <RequirePermission permission="team">
      <TeamScreen />
    </RequirePermission>
  );
}
