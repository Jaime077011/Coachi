"use client";

import { useSyncExternalStore } from "react";

let loadedAt: number | null = null;
const subscribe = () => () => {};

/**
 * The time the page loaded, in the browser only (null while prerendering).
 * With Cache Components, reading the clock during render would bake the build time into
 * the static HTML, so screens that show "today" wait for this instead.
 */
export function useNow(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => (loadedAt ??= Date.now()),
    () => null,
  );
}

export const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
