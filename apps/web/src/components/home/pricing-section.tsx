"use client";

import { api } from "@coachi/core";
import type { PlanWithFeatures } from "@coachi/validation";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

/** Plans come from the super admin's Plans editor, so prices here never go stale. */
export function PricingSection() {
  const t = useTranslations("home");
  const plans = useQuery({ queryKey: qk.plans, queryFn: () => api.billing.plans() });

  return (
    <section aria-labelledby="pricing-title" className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 id="pricing-title" className="font-display text-[32px] leading-[1.1] uppercase lg:text-[44px]">
          {t("pricingTitle")}
        </h2>
        <p className="max-w-2xl text-muted-foreground">{t("pricingBody")}</p>
      </div>
      {plans.isSuccess && plans.data.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-3">
          {plans.data.map((p, i) => (
            <PlanCard key={p.plan.id} plan={p} highlighted={i === 1} />
          ))}
        </ul>
      ) : plans.isPending ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        // Plans failed to load: say how to ask instead of showing nothing.
        <p className="text-muted-foreground">{t("pricingFallback")}</p>
      )}
    </section>
  );
}

function PlanCard({ plan: { plan, features }, highlighted }: { plan: PlanWithFeatures; highlighted: boolean }) {
  const t = useTranslations("home");
  const fmt = useFmt();
  const f = Object.fromEntries(features.map((x) => [x.key, x.value]));
  const seats = typeof f.team_seats === "number" ? f.team_seats : 0;
  const lines = [
    // client_limit null = unlimited.
    typeof f.client_limit === "number" ? t("planClients", { n: f.client_limit }) : t("planUnlimited"),
    seats > 0 ? t("planSeats", { n: seats }) : t("planSolo"),
    f.nutrition ? t("planNutrition") : null,
    f.directory_listing ? t("planDirectory") : null,
    f.branded_app ? t("planBranded") : null,
  ].filter((l): l is string => !!l);

  return (
    <li className={cn("flex flex-col gap-4 rounded-xl border bg-card p-5", highlighted && "border-primary ring-1 ring-primary/40")}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[17px] font-semibold">{plan.name}</h3>
        {highlighted && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">{t("popular")}</span>}
      </div>
      <p className="flex items-baseline gap-1">
        <span className="font-display text-4xl tabular-nums">{plan.price_piasters === 0 ? t("free") : fmt.egp(plan.price_piasters)}</span>
        <span className="text-sm text-hint">{plan.price_piasters === 0 ? t("forDays", { n: plan.days }) : t("perDays", { n: plan.days })}</span>
      </p>
      <ul className="flex flex-col gap-2 text-sm">
        {lines.map((line) => (
          <li key={line} className="flex items-start gap-2">
            <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            {line}
          </li>
        ))}
      </ul>
    </li>
  );
}
