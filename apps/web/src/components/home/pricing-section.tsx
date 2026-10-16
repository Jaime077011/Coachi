"use client";

import { api } from "@coachi/core";
import { periodPrice } from "@coachi/validation";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";

/** No plans: a price per client and per team member (from the super admin's Pricing), everything included. */
export function PricingSection() {
  const t = useTranslations("home");
  const fmt = useFmt();
  const pricing = useQuery({ queryKey: qk.pricing, queryFn: () => api.billing.pricing() });
  const [clients, setClients] = useState(15);
  const [helpers, setHelpers] = useState(0);

  return (
    <section aria-labelledby="pricing-title" className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 id="pricing-title" className="font-display text-[32px] leading-[1.1] uppercase lg:text-[44px]">
          {t("pricingTitle")}
        </h2>
        <p className="max-w-2xl text-muted-foreground">{t("pricingBody")}</p>
      </div>
      {pricing.isSuccess ? (
        <div className="flex flex-col gap-4">
          <ul className="grid gap-4 md:grid-cols-3">
            <PriceCard title={t("perClient")} price={fmt.egp(pricing.data.client_seat_piasters)} per={t("perDays", { n: pricing.data.period_days })} highlighted />
            <PriceCard title={t("perHelper")} price={fmt.egp(pricing.data.team_seat_piasters)} per={t("perDays", { n: pricing.data.period_days })} note={t("ownerFree")} />
            <PriceCard
              title={t("trialTitle")}
              price={t("free")}
              per={t("forDays", { n: pricing.data.trial_days })}
              note={t("trialBody", { n: pricing.data.trial_client_seats })}
            />
          </ul>

          <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="calc-clients">{t("calcClients")}</Label>
              <Input id="calc-clients" dir="ltr" inputMode="numeric" className="tabular-nums" value={clients} onChange={(e) => setClients(Math.max(0, Math.min(500, Math.round(Number(e.target.value)) || 0)))} />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="calc-helpers">{t("calcHelpers")}</Label>
              <Input id="calc-helpers" dir="ltr" inputMode="numeric" className="tabular-nums" value={helpers} onChange={(e) => setHelpers(Math.max(0, Math.min(50, Math.round(Number(e.target.value)) || 0)))} />
            </div>
            <p className="flex-1 text-sm text-muted-foreground" aria-live="polite">
              {t("calcTotal")}
              <span className="block font-display text-3xl text-foreground tabular-nums">{fmt.egp(periodPrice(pricing.data, clients, helpers))}</span>
              {t("perDays", { n: pricing.data.period_days })}
            </p>
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {(["nutrition", "directory", "branded", "page", "team"] as const).map((key) => (
              <li key={key} className="flex items-center gap-2">
                <CheckIcon className="size-4 text-success" aria-hidden />
                {t(`incl_${key}`)}
              </li>
            ))}
          </ul>
        </div>
      ) : pricing.isPending ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : (
        // Prices failed to load: say how to ask instead of showing nothing.
        <p className="text-muted-foreground">{t("pricingFallback")}</p>
      )}
    </section>
  );
}

function PriceCard({ title, price, per, note, highlighted }: { title: string; price: string; per: string; note?: string; highlighted?: boolean }) {
  return (
    <li className={highlighted ? "flex flex-col gap-3 rounded-xl border border-primary bg-card p-5 ring-1 ring-primary/40" : "flex flex-col gap-3 rounded-xl border bg-card p-5"}>
      <h3 className="text-[17px] font-semibold">{title}</h3>
      <p className="flex items-baseline gap-1">
        <span className="font-display text-4xl tabular-nums">{price}</span>
        <span className="text-sm text-hint">{per}</span>
      </p>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
    </li>
  );
}
