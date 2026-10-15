"use client";

import { CircleAlertIcon, WifiOffIcon, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Every empty list: icon, one line, one button that fixes it. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center", className)}>
      <span className="grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="size-6" aria-hidden />
      </span>
      <p className="font-semibold">{title}</p>
      {body && <p className="max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action}
    </div>
  );
}

/** Page fails to load: what failed + Try again. */
export function ErrorState({ onRetry, className }: { onRetry: () => void; className?: string }) {
  const t = useTranslations("states");
  const tCommon = useTranslations("common");
  return (
    <div role="alert" className={cn("flex flex-col items-center gap-3 rounded-lg border px-6 py-10 text-center", className)}>
      <CircleAlertIcon className="size-8 text-destructive" aria-hidden />
      <p className="font-semibold">{t("errorTitle")}</p>
      <p className="text-sm text-muted-foreground">{t("errorBody")}</p>
      <Button variant="secondary" onClick={onRetry}>
        {tCommon("tryAgain")}
      </Button>
    </div>
  );
}

/** Skeleton rows in the shape of a list. No full-page spinners. */
export function ListSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  const t = useTranslations("common");
  return (
    <div className={cn("flex flex-col gap-3", className)} aria-busy aria-label={t("loading")}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-lg" />
      ))}
    </div>
  );
}

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function useOnline() {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}

/** "You're offline. Your sets are saved on this phone and will sync." */
export function OfflineBanner() {
  const t = useTranslations("states");
  const online = useOnline();
  if (online) return null;
  return (
    <div role="status" className="flex items-center gap-2 bg-warning/12 px-4 py-2 text-sm font-semibold text-warning">
      <WifiOffIcon className="size-4 shrink-0" aria-hidden />
      {t("offline")}
    </div>
  );
}
