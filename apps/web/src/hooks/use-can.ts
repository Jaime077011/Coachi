"use client";

import { memberCan, type TeamPermission } from "@coachi/validation";
import { useSyncExternalStore } from "react";
import { useSession } from "./use-session";

const noSubscribe = () => () => {};

/**
 * "Can the signed-in team member do X?" Screens hide what the role can't do (no disabled
 * buttons); the API and, in Step 4, the row rules refuse it anyway.
 * Only coach accounts have team roles; the super admin in support mode sees everything.
 *
 * Answers "no" while hydrating, like the server (which has no session). A Suspense boundary can
 * hydrate after the session has loaded; without this its menus would differ from the server HTML.
 */
export function useCan() {
  const { data: session } = useSession();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return (permission: TeamPermission) => {
    if (!hydrated || !session) return false;
    if (session.profile.role !== "coach") return true;
    return memberCan(session.member_role, permission);
  };
}
