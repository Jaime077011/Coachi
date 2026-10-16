"use client";

import { api } from "@coachi/core";
import { periodPrice, type CoachSubscriptionView, type SubscriptionStatus } from "@coachi/validation";
import { useQuery } from "@tanstack/react-query";
import { CircleCheckIcon, MessageCircleIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SUPPORT_WHATSAPP } from "@/components/coach/limit-notice";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenHeader, SectionTitle } from "@/components/coachi/screen-header";
import { StatusChip, type Tone } from "@/components/coachi/status-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useMe } from "@/hooks/use-session";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { whatsappUrl } from "@/lib/whatsapp";

const tone: Record<SubscriptionStatus, Tone> = { trial: "info", active: "success", ending_soon: "warning", expired: "danger", paused: "neutral" };

/** Owner only: seats bought vs used, what a period costs, change seats (sent on WhatsApp), payments. */
export function SubscriptionScreen() {
  const t = useTranslations("subscription");
  const tParts = useTranslations("parts");
  const fmt = useFmt();
  const { orgId } = useMe();
  const sub = useQuery({ queryKey: qk.subscription(orgId), queryFn: () => api.billing.mySubscription(orgId), enabled: !!orgId });
  const payments = useQuery({ queryKey: qk.payments(orgId), queryFn: () => api.billing.payments(orgId), enabled: !!orgId });

  return (
    <div className="flex flex-col gap-6">
      <ScreenHeader title={t("title")} className="mb-0" />
      <QueryState query={sub}>
        {(s) => (
          <div className="flex flex-col gap-6">
            <Card>
              <CardContent className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-hint">{t("perPeriod", { days: s.pricing.period_days })}</p>
                    <p className="font-display text-[32px] leading-tight tabular-nums">{fmt.egp(s.period_piasters)}</p>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {t("breakdown", {
                        clients: s.subscription.client_seats,
                        clientPrice: fmt.egp(s.pricing.client_seat_piasters),
                        team: s.subscription.team_seats,
                        teamPrice: fmt.egp(s.pricing.team_seat_piasters),
                      })}
                    </p>
                  </div>
                  <StatusChip tone={tone[s.subscription.status]}>{t(`status_${s.subscription.status}`)}</StatusChip>
                </div>
                <SeatBar label={t("clientSeats")} used={s.client_count} seats={s.subscription.client_seats} />
                <SeatBar label={t("teamSeats")} used={s.team_count} seats={s.subscription.team_seats} />
                <div>
                  <p className="font-semibold">{t("endsOn", { date: fmt.date(s.subscription.ends_at, "long") })}</p>
                  {s.days_left > 0 && <p className="text-sm text-muted-foreground">{t("daysLeft", { count: s.days_left })}</p>}
                </div>
                <Button asChild size="lg" className="w-full">
                  <a
                    href={whatsappUrl(
                      SUPPORT_WHATSAPP,
                      t("renewMessage", { clients: s.subscription.client_seats, team: s.subscription.team_seats, price: fmt.egp(s.period_piasters) }),
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircleIcon data-icon="inline-start" />
                    {t("renew")}
                  </a>
                </Button>
              </CardContent>
            </Card>

            <ChangeSeats s={s} />

            <section>
              <SectionTitle>{t("included")}</SectionTitle>
              <ul className="flex flex-col gap-2 rounded-lg border bg-card p-4 text-sm">
                {(["nutrition", "directory_listing", "branded_app", "landing", "team"] as const).map((key) => (
                  <li key={key} className="flex items-center gap-2">
                    <CircleCheckIcon className="size-4 text-success" aria-hidden />
                    {t(`feature_${key}`)}
                  </li>
                ))}
              </ul>
            </section>

            {payments.data && payments.data.length > 0 && (
              <section>
                <SectionTitle>{t("payments")}</SectionTitle>
                <ul className="divide-y rounded-lg border bg-card text-sm">
                  {payments.data.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                      <span>{fmt.date(p.paid_at)}</span>
                      {p.client_seats !== null && <span className="text-hint">{t("seatsShort", { clients: p.client_seats, team: p.team_seats ?? 0 })}</span>}
                      <span className="text-hint">{tParts(`paymentMethod.${p.method}`)}</span>
                      <span className="font-semibold tabular-nums">{fmt.egp(p.amount_piasters)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </QueryState>
    </div>
  );
}

function SeatBar({ label, used, seats }: { label: string; used: number; seats: number }) {
  const t = useTranslations("subscription");
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums">{t("used", { used, seats })}</span>
      </div>
      <Progress value={seats === 0 ? (used > 0 ? 100 : 0) : Math.min(100, (used / seats) * 100)} aria-label={label} />
    </div>
  );
}

/** Pick new seat counts, see the new price, send the request on WhatsApp. The admin records the payment. */
function ChangeSeats({ s }: { s: CoachSubscriptionView }) {
  const t = useTranslations("subscription");
  const fmt = useFmt();
  const [clients, setClients] = useState(s.subscription.client_seats);
  const [team, setTeam] = useState(s.subscription.team_seats);
  const price = periodPrice(s.pricing, clients, team);
  const changed = clients !== s.subscription.client_seats || team !== s.subscription.team_seats;
  return (
    <section className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div>
        <p className="text-[17px] font-semibold">{t("changeSeats")}</p>
        <p className="text-sm text-muted-foreground">{t("changeSeatsBody")}</p>
      </div>
      <Stepper id="want-clients" label={t("clientSeats")} value={clients} min={Math.max(0, s.client_count)} onChange={setClients} />
      <Stepper id="want-team" label={t("teamSeats")} value={team} min={Math.max(0, s.team_count)} onChange={setTeam} />
      <p className="text-sm">
        {t.rich("newPrice", { price: fmt.egp(price), days: s.pricing.period_days, b: (chunks) => <b className="tabular-nums">{chunks}</b> })}
      </p>
      <Button asChild variant={changed ? "default" : "secondary"} className="w-full">
        <a href={whatsappUrl(SUPPORT_WHATSAPP, t("seatsMessage", { clients, team, price: fmt.egp(price) }))} target="_blank" rel="noreferrer">
          <MessageCircleIcon data-icon="inline-start" />
          {t("sendRequest")}
        </a>
      </Button>
    </section>
  );
}

/** Number with − / + (can't go below what's in use: those clients and helpers need their seats). */
function Stepper({ id, label, value, min, onChange }: { id: string; label: string; value: number; min: number; onChange: (n: number) => void }) {
  const t = useTranslations("subscription");
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" size="icon" className="size-11 shrink-0" aria-label={t("less", { label })} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
          <MinusIcon />
        </Button>
        <Input
          id={id}
          dir="ltr"
          inputMode="numeric"
          className="text-center tabular-nums"
          value={value}
          onChange={(e) => onChange(Math.max(min, Math.min(500, Math.round(Number(e.target.value)) || 0)))}
        />
        <Button type="button" variant="secondary" size="icon" className="size-11 shrink-0" aria-label={t("more", { label })} onClick={() => onChange(Math.min(500, value + 1))}>
          <PlusIcon />
        </Button>
      </div>
    </div>
  );
}
