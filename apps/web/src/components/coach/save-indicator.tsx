"use client";

import { CircleAlertIcon, CircleCheckIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SaveStatus } from "@/lib/use-autosave";
import { cn } from "@/lib/utils";

/** "Saving" then "Saved" next to a builder title. No Save button. */export function SaveIndicator({ status }: { status: SaveStatus }) {
  const t = useTranslations("builder");
  const tStates = useTranslations("states");
  if (status === "idle") return null;
  return (
    <span className={cn("flex items-center gap-1 text-xs font-semibold", status === "error" ? "text-destructive" : "text-hint")} aria-live="polite">
      {status === "saving" && <Loader2Icon className="size-3.5 animate-spin" aria-hidden />}
      {status === "saved" && <CircleCheckIcon className="size-3.5" aria-hidden />}
      {status === "error" && <CircleAlertIcon className="size-3.5" aria-hidden />}
      {status === "saving" ? t("saving") : status === "saved" ? t("saved") : tStates("errorTitle")}
    </span>
  );
}
