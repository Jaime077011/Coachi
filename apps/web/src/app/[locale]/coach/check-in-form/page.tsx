import { RequirePermission } from "@/components/coach/require-permission";
import { CheckinFormScreen } from "./checkin-form-screen";

export default function Page() {
  return (
    <RequirePermission permission="checkin_form">
      <CheckinFormScreen />
    </RequirePermission>
  );
}
