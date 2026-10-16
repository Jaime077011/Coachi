"use client";

import { api } from "@coachi/core";
import { useQuery } from "@tanstack/react-query";
import { ClipboardPlusIcon, DumbbellIcon, PencilIcon, UtensilsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionTitle } from "@/components/coachi/screen-header";
import { EmptyState, ListSkeleton } from "@/components/coachi/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCan } from "@/hooks/use-can";
import { useMe } from "@/hooks/use-session";
import { Link } from "@/i18n/navigation";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";

export function PlansTab({ clientId, onAssign }: { clientId: string; onAssign: () => void }) {
  const t = useTranslations("clientFile");
  const tPlans = useTranslations("plans");
  const tNb = useTranslations("nutritionBuilder");
  const fmt = useFmt();
  const { coachId } = useMe();
  const canEdit = useCan()("plans_edit");
  const programs = useQuery({ queryKey: qk.programs(coachId), queryFn: () => api.training.programs(coachId), enabled: !!coachId });
  const nutrition = useQuery({ queryKey: qk.nutritionPlans(coachId), queryFn: () => api.nutrition.plans(coachId), enabled: !!coachId });

  if (programs.isPending || nutrition.isPending) return <ListSkeleton rows={2} />;
  const program = programs.data?.find((p) => p.client_id === clientId);
  const plans = nutrition.data?.filter((p) => p.client_id === clientId) ?? [];

  const assign = canEdit && (
    <Button variant="secondary" onClick={onAssign}>
      <ClipboardPlusIcon data-icon="inline-start" />
      {t("assignPlan")}
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <section>
        <SectionTitle>{t("workoutPlan")}</SectionTitle>
        {program ? (
          <Card>
            <CardContent className="flex items-center gap-3">
              <DumbbellIcon className="size-6 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{program.name}</p>
                <p className="text-sm text-muted-foreground">
                  {t("weeks", { count: program.weeks })}
                  {program.starts_on && ` · ${fmt.date(program.starts_on, "short")}`}
                </p>
              </div>
              {canEdit && (
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/coach/plans/workout/${program.id}`}>
                    <PencilIcon data-icon="inline-start" />
                    {tPlans("edit")}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <EmptyState icon={DumbbellIcon} title={t("noWorkoutPlan")} action={assign} />
        )}
      </section>
      <section>
        <SectionTitle>{t("nutritionPlan")}</SectionTitle>
        {plans.length > 0 ? (
          <div className="flex flex-col gap-2">
            {plans.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex items-center gap-3">
                  <UtensilsIcon className="size-6 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {tNb(p.day_type)} · {fmt.kcal(p.targets.kcal)}
                    </p>
                  </div>
                  {canEdit && (
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/coach/plans/nutrition/${p.id}`}>
                        <PencilIcon data-icon="inline-start" />
                        {tPlans("edit")}
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={UtensilsIcon} title={t("noNutritionPlan")} action={assign} />
        )}
      </section>
    </div>
  );
}
