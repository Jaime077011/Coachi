"use client";

import { api } from "@coachi/core";
import type { SubscriptionStatus } from "@coachi/validation";
import { useQuery } from "@tanstack/react-query";
import { CircleCheckIcon, CircleMinusIcon, MessageCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { SUPPORT_WHATSAPP } from "@/components/coach/limit-notice";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenHeader, SectionTitle } from "@/components/coachi/screen-header";
import { StatusChip, type Tone } from "@/components/coachi/status-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMe } from "@/hooks/use-session";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { whatsappUrl } from "@/lib/whatsapp";

const tone: Record<SubscriptionStatus, Tone> = { trial: "info", active: "success", ending_soon: "warning", expired: "danger", paused: "neutral" };

export function SubscriptionScreen() {
  const t = useTranslations("subscription");
  const tParts = useTranslations("parts");
  const fmt = useFmt();
  const { orgId } = useMe();
  const sub = useQuery({ queryKey: qk.subscription(orgId), queryFn: () => api.billing.mySubscription(orgId), enabled: !!orgId });
  const plans = useQuery({ queryKey: qk.plans, queryFn: () => api.billing.plans() });
  const payments = useQuery({ queryKey: qk.payments(orgId), queryFn: () => api.billing.payments(orgId), enabled: !!orgId });

  return (
    <div className="flex flex-col gap-6">
      <ScreenHeader title={t("title")} className="mb-0" />
      <QueryState query={sub}>
        {(s) => {
          const features = plans.data?.find((p) => p.plan.id === s.plan.id)?.features ?? [];
          const has = (key: string) => features.find((f) => f.key === key)?.value === true;
          return (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardContent className="flex flex-col gap-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-hint">{t("plan")}</p>
                      <p className="font-display text-[32px] leading-tight uppercase">{s.plan.name}</p>
                      <p className="text-sm text-muted-foreground tabular-nums">{fmt.egp(s.plan.price_piasters)}</p>
                    </div>
                    <StatusChip tone={tone[s.subscription.status]}>{t(`status_${s.subscription.status}`)}</StatusChip>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">{t("clients")}</span>
                      <span className="tabular-nums">
                        {s.client_limit === null ? t("unlimited", { count: s.client_count }) : t("clientsOf", { count: s.client_count, limit: s.client_limit })}
                      </span>
                    </div>
                    {s.client_limit !== null && <Progress value={(s.client_count / s.client_limit) * 100} aria-label={t("clients")} />}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{t("teamSeats")}</span>
                    <span className="tabular-nums">
                      {s.team_seats === null ? t("unlimited", { count: s.team_count }) : t("clientsOf", { count: s.team_count, limit: s.team_seats })}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{t("endsOn", { date: fmt.date(s.subscription.ends_at, "long") })}</p>
                    {s.days_left > 0 && <p className="text-sm text-muted-foreground">{t("daysLeft", { count: s.days_left })}</p>}
                  </div>
                  <Button asChild size="lg">
                    <a href={whatsappUrl(SUPPORT_WHATSAPP, t("renewMessage", { plan: s.plan.name }))} target="_blank" rel="noreferrer">
                      <MessageCircleIcon data-icon="inline-start" />
                      {t("renew")}
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-6">
                <section>
                  <SectionTitle>{t("features")}</SectionTitle>
                  <ul className="flex flex-col gap-2 rounded-lg border bg-card p-4 text-sm">
                    {(["nutrition", "directory_listing", "branded_app"] as const).map((key) => (
                      <li key={key} className="flex items-center gap-2">
                        {has(key) ? <CircleCheckIcon className="size-4 text-success" aria-hidden /> : <CircleMinusIcon className="size-4 text-hint" aria-hidden />}
                        <span className={has(key) ? "" : "text-hint line-through"}>{t(`feature_${key}`)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                {payments.data && payments.data.length > 0 && (
                  <section>
                    <SectionTitle>{t("payments")}</SectionTitle>
                    <ul className="divide-y rounded-lg border bg-card text-sm">
                      {payments.data.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-3 p-3">
                          <span>{fmt.date(p.paid_at)}</span>
                          <span className="text-hint">{tParts(`paymentMethod.${p.method}`)}</span>
                          <span className="font-semibold tabular-nums">{fmt.egp(p.amount_piasters)}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </div>
          );
        }}
      </QueryState>
    </div>
  );
}
