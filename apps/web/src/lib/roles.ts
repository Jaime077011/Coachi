import type { Role } from "@coachi/validation";

/** Where each role lands after login. Nobody sees another role's screens. */
export const roleHome: Record<Role, string> = {
  client: "/app/today",
  coach: "/coach/today",
  super_admin: "/admin/overview",
};
