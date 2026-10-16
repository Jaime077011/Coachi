"use client";

import { api } from "@coachi/core";
import { periodPrice, type SeatPricing } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { InfoIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenHeader, SectionTitle } from "@/components/coachi/screen-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiErrorToast } from "@/lib/api-error";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";

/** No plans: one price per client seat, one per team seat, per period. Every coach gets every feature. */
export function PricingScreen() {
  const t = useTranslations("admin.pricing");
  const pricing = useQuery({ queryKey: qk.pricing, queryFn: () => api.billing.pricing() });
  return (
    <div className="flex flex-col gap-6">
      <ScreenHeader title={t("title")} subtitle={t("subtitle")} className="mb-0" />
      <QueryState query={pricing}>{(p) => <PricingForm initial={p} />}</QueryState>
    </div>
  );
}

const egp = (piasters: number) => String(piasters / 100);
const toPiasters = (v: string) => Math.max(0, Math.round(Number(v.replace(",", ".")) * 100) || 0);
const toInt = (v: string, max: number) => Math.min(max, Math.max(0, Math.round(Number(v)) || 0));

function PricingForm({ initial }: { initial: SeatPricing }) {
  const t = useTranslations("admin.pricing");
  const fmt = useFmt();
  const queryClient = useQueryClient();
  const showError = useApiErrorToast();
  const [form, setForm] = useState({
    client: egp(initial.client_seat_piasters),
    team: egp(initial.team_seat_piasters),
    period: String(initial.period_days),
    trialDays: String(initial.trial_days),
    trialSeats: String(initial.trial_client_seats),
  });
  const next: SeatPricing = {
    ...initial,
    client_seat_piasters: toPiasters(form.client),
    team_seat_piasters: toPiasters(form.team),
    period_days: Math.max(1, toInt(form.period, 366)),
    trial_days: toInt(form.trialDays, 90),
    trial_client_seats: toInt(form.trialSeats, 100),
  };
  const save = useMutation({
    mutationFn: () => api.billing.savePricing(next),
    onSuccess: (saved) => {
      queryClient.setQueryData(qk.pricing, saved);
      void queryClient.invalidateQueries({ queryKey: qk.adminCoaches });
      toast.success(t("saved"));
    },
    onError: showError,
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  const field = (k: keyof typeof form, label: string, hint?: string) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`price-${k}`}>{label}</Label>
      <Input id={`price-${k}`} dir="ltr" inputMode="decimal" className="tabular-nums" value={form[k]} onChange={set(k)} />
      {hint && <p className="text-xs text-hint">{hint}</p>}
    </div>
  );

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <section className="flex flex-col gap-4">
        <SectionTitle className="mb-0">{t("seats")}</SectionTitle>
        {field("client", t("clientSeat"), t("clientSeatHint"))}
        {field("team", t("teamSeat"), t("teamSeatHint"))}
        {field("period", t("period"))}
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle className="mb-0">{t("trial")}</SectionTitle>
        {field("trialDays", t("trialDays"))}
        {field("trialSeats", t("trialSeats"), t("trialSeatsHint"))}
      </section>

      <Card>
        <CardContent className="flex items-start gap-3 text-sm">
          <InfoIcon className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
          <p>
            {t("example", {
              clients: 20,
              helpers: 1,
              price: fmt.egp(periodPrice(next, 20, 1)),
              days: next.period_days,
            })}
          </p>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">{t("appliesNext")}</p>

      <div className="border-t pt-4">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending && <Loader2Icon className="animate-spin" />}
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
