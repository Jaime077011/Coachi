import { RequirePermission } from "@/components/coach/require-permission";
import { RequestsScreen } from "./requests-screen";

export default function Page() {
  return (
    <RequirePermission permission="requests">
      <RequestsScreen />
    </RequirePermission>
  );
}
