import { RequirePermission } from "@/components/coach/require-permission";
import { SubscriptionScreen } from "./subscription-screen";

export default function Page() {
  return (
    <RequirePermission permission="subscription">
      <SubscriptionScreen />
    </RequirePermission>
  );
}
