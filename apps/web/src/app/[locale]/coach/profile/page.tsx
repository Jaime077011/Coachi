import { RequirePermission } from "@/components/coach/require-permission";
import { ProfileScreen } from "./profile-screen";

export default function Page() {
  return (
    <RequirePermission permission="profile">
      <ProfileScreen />
    </RequirePermission>
  );
}
