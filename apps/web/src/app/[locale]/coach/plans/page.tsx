import { RequirePermission } from "@/components/coach/require-permission";
import { PlansScreen } from "./plans-screen";

export default function Page() {
  return (
    <RequirePermission permission="plans_edit">
      <PlansScreen />
    </RequirePermission>
  );
}
