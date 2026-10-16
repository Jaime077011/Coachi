"use client";

import { api } from "@coachi/core";
import type { FeatureKey, PlanWithFeatures } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenHeader } from "@/components/coachi/screen-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";

/** Plans give features, not fixed limits. Edit them as switches and number fields. */
export function PlansAdminScreen() {
  const t = useTranslations("admin.plans");
  const plans = useQuery({ queryKey: qk.plans, queryFn: () => api.billing.plans() });
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title={t("title")} />
      <QueryState query={plans}>
        {(list) => (
          <div className="flex flex-col gap-4">
            {list.map((p) => (
              <PlanCard key={p.plan.id} data={p} />
            ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}

function PlanCard({ data }: { data: PlanWithFeatures }) {
  const t = useTranslations("admin.plans");
  const tSub = useTranslations("subscription");
  const fmt = useFmt();
  const queryClient = useQueryClient();
  const value = (key: FeatureKey) => data.features.find((f) => f.key === key)?.value ?? null;

  const update = useMutation({
    mutationFn: ({ key, value }: { key: FeatureKey; value: number | boolean | null }) => api.billing.updatePlanFeature(data.plan.id, key, value),
    onSuccess: (next) => {
      queryClient.setQueryData<PlanWithFeatures[]>(qk.plans, (old) => old?.map((p) => (p.plan.id === next.plan.id ? next : p)));
      toast.success(t("saved"));
    },
  });

  const limit = value("client_limit");
  const seats = value("team_seats");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-[28px] uppercase">{data.plan.name}</CardTitle>
        <p className="text-sm text-muted-foreground tabular-nums">
          {fmt.egp(data.plan.price_piasters)} · {data.plan.days} d
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="flex items-center gap-2 rounded-md bg-info/12 p-2 text-xs font-semibold text-info">
          <InfoIcon className="size-4 shrink-0" aria-hidden />
          {t("affects", { count: data.coaches_on_plan })}
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`lim-${data.plan.id}`}>{t("clientLimit")}</Label>
          <div className="flex items-center gap-3">
            <Input
              id={`lim-${data.plan.id}`}
              dir="ltr"
              inputMode="numeric"
              className="h-10 w-24 tabular-nums"
              disabled={limit === null}
              defaultValue={typeof limit === "number" ? limit : ""}
              onBlur={(e) => {
                const n = Math.max(1, Number(e.target.value) || 1);
                if (n !== limit) update.mutate({ key: "client_limit", value: n });
              }}
            />
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={limit === null} onCheckedChange={(on) => update.mutate({ key: "client_limit", value: on ? null : 20 })} />
              {t("unlimited")}
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`seats-${data.plan.id}`}>{t("teamSeats")}</Label>
          <div className="flex items-center gap-3">
            <Input
              id={`seats-${data.plan.id}`}
              dir="ltr"
              inputMode="numeric"
              className="h-10 w-24 tabular-nums"
              disabled={seats === null}
              defaultValue={typeof seats === "number" ? seats : ""}
              onBlur={(e) => {
                const n = Math.max(0, Number(e.target.value) || 0);
                if (n !== seats) update.mutate({ key: "team_seats", value: n });
              }}
            />
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={seats === null} onCheckedChange={(on) => update.mutate({ key: "team_seats", value: on ? null : 1 })} />
              {t("unlimited")}
            </label>
          </div>
        </div>
        {(["nutrition", "directory_listing", "branded_app"] as const).map((key) => (
          <label key={key} className="flex min-h-11 items-center justify-between gap-3 text-sm">
            {tSub(`feature_${key}`)}
            <Switch checked={value(key) === true} onCheckedChange={(on) => update.mutate({ key, value: on })} />
          </label>
        ))}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`ai-${data.plan.id}`}>{t("aiCredits")}</Label>
          <Input
            id={`ai-${data.plan.id}`}
            dir="ltr"
            inputMode="numeric"
            className="h-10 w-24 tabular-nums"
            defaultValue={typeof value("ai_credits") === "number" ? (value("ai_credits") as number) : 0}
            onBlur={(e) => update.mutate({ key: "ai_credits", value: Math.max(0, Number(e.target.value) || 0) })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
