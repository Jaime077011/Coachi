"use client";

import { memberCan, type TeamPermission } from "@coachi/validation";
import { useSession } from "./use-session";

/**
 * "Can the signed-in team member do X?" Screens hide what the role can't do (no disabled
 * buttons); the API and, in Step 4, the row rules refuse it anyway.
 * Only coach accounts have team roles; the super admin in support mode sees everything.
 */
export function useCan() {
  const { data: session } = useSession();
  return (permission: TeamPermission) => {
    if (!session) return false;
    if (session.profile.role !== "coach") return true;
    return memberCan(session.member_role, permission);
  };
}
