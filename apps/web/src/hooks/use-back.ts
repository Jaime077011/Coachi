"use client";

import { useSearchParams } from "next/navigation";
import { safeBack } from "@/components/coachi/screen-panel";

/** The screen to return to: ?back= when it's an in-app path, else the fallback. Use inside <Suspense>. */
export function useBack(fallback: string) {
  return safeBack(useSearchParams().get("back"), fallback);
}
