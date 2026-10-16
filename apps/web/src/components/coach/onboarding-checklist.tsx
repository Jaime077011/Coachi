"use client";

import { api } from "@coachi/core";
import { useQuery } from "@tanstack/react-query";
import { CircleCheckIcon, CircleIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMe } from "@/hooks/use-session";
import { Link } from "@/i18n/navigation";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

const DISMISS_EVENT = "coachi:onboarding";
const dismissKey = (orgId: string) => `coachi.onboarding.dismissed.${orgId}`;

function useDismissed(orgId: string) {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(DISMISS_EVENT, cb);
      return () => window.removeEventListener(DISMISS_EVENT, cb);
    },
    () => {
      try {
        return localStorage.getItem(dismissKey(orgId)) === "1";
      } catch {
        return false;
      }
    },
    // Server and first paint: hidden, so it never flashes for a coach who closed it.
    () => true,
  );
}

/**
 * Full Spec > Onboarding: 3 steps on first login (logo, first client, starter template).
 * Each step ticks itself from real data; the card goes away when all 3 are done or he closes it.
 */
export function OnboardingChecklist({ onAddClient }: { onAddClient: () => void }) {
  const t = useTranslations("onboarding");
  const { session, orgId, coachId } = useMe();
  const isOwner = session?.member_role === "owner";
  const dismissed = useDismissed(orgId);
  const enabled = isOwner && !dismissed && !!orgId;

  const brand = useQuery({ queryKey: qk.brand(orgId), queryFn: () => api.directory.brand(orgId), enabled });
  const clients = useQuery({ queryKey: qk.clients(coachId), queryFn: () => api.clients.list(coachId), enabled });
  const programs = useQuery({ queryKey: qk.programs(coachId), queryFn: () => api.training.programs(coachId), enabled });

  if (!enabled || !brand.isSuccess || !clients.isSuccess || !programs.isSuccess) return null;

  const steps = [
    { key: "logo", done: !!brand.data.logo_url, action: <Link href="/coach/profile">{t("logoAction")}</Link> },
    { key: "client", done: clients.data.length > 0, action: t("clientAction"), onClick: onAddClient },
    { key: "template", done: programs.data.some((p) => p.client_id !== null), action: <Link href="/coach/plans">{t("templateAction")}</Link> },
  ] as const;
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(dismissKey(orgId), "1");
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(DISMISS_EVENT));
  };

  return (
    <Card className="border-primary/40">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <p className="text-[17px] font-semibold">{t("title")}</p>
            <p className="text-sm text-muted-foreground">{t("progress", { done: doneCount, total: steps.length })}</p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label={t("dismiss")} title={t("dismiss")} onClick={dismiss}>
            <XIcon />
          </Button>
        </div>
        <Progress value={(doneCount / steps.length) * 100} aria-label={t("progress", { done: doneCount, total: steps.length })} />
        <ol className="flex flex-col gap-2">
          {steps.map((s, i) => (
            <li key={s.key} className="flex min-h-11 items-center gap-3">
              {s.done ? (
                <CircleCheckIcon className="size-5 shrink-0 text-success" aria-hidden />
              ) : (
                <CircleIcon className="size-5 shrink-0 text-hint" aria-hidden />
              )}
              <span className={cn("flex-1", s.done && "text-muted-foreground line-through")}>
                <span className="sr-only">{s.done ? t("doneLabel") : t("todoLabel")} </span>
                {i + 1}. {t(`${s.key}Title`)}
              </span>
              {!s.done &&
                ("onClick" in s ? (
                  <Button size="sm" onClick={s.onClick}>
                    {s.action}
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" asChild>
                    {s.action}
                  </Button>
                ))}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
