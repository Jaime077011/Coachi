"use client";

import { api } from "@coachi/core";
import { useQuery } from "@tanstack/react-query";

export const sessionKey = ["session"] as const;

export function useSession() {
  return useQuery({ queryKey: sessionKey, queryFn: () => api.auth.getSession(), staleTime: Infinity });
}

/** The signed-in user's ids. Empty strings until the session loads; gate queries with `enabled`. */
export function useMe() {
  const { data } = useSession();
  return {
    ready: !!data,
    session: data ?? null,
    clientId: data?.client_id ?? "",
    coachId: data?.coach_id ?? "",
    orgId: data?.org_id ?? "",
  };
}
