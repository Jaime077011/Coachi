"use client";

import { api } from "@coachi/core";
import { useQuery } from "@tanstack/react-query";
import { BookmarkIcon, DumbbellIcon, PencilIcon, PlusIcon, UsersRoundIcon, UtensilsIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import type { PlanKind } from "@/components/coach/assign-forms";
import { ScreenHeader, SectionTitle } from "@/components/coachi/screen-header";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/coachi/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMe } from "@/hooks/use-session";
import { Link } from "@/i18n/navigation";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";

type Row = { id: string; name: string; clientId: string | null; meta: string };

export function PlansScreen() {
  const t = useTranslations("plans");
  const tNb = useTranslations("nutritionBuilder");
  const tFile = useTranslations("clientFile");
  const fmt = useFmt();
  const { coachId } = useMe();
  const programs = useQuery({ queryKey: qk.programs(coachId), queryFn: () => api.training.programs(coachId), enabled: !!coachId });
  const nutrition = useQuery({ queryKey: qk.nutritionPlans(coachId), queryFn: () => api.nutrition.plans(coachId), enabled: !!coachId });
  const clients = useQuery({ queryKey: qk.clients(coachId), queryFn: () => api.clients.list(coachId), enabled: !!coachId });
  const clientName = (id: string | null) => clients.data?.find((c) => c.id === id)?.name ?? "";

  const workoutRows: Row[] = (programs.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    clientId: p.client_id,
    meta: tFile("weeks", { count: p.weeks }),
  }));
  const nutritionRows: Row[] = (nutrition.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    clientId: p.client_id,
    meta: `${tNb(p.day_type)} · ${fmt.kcal(p.targets.kcal)}`,
  }));

  const list = (kind: PlanKind, rows: Row[], query: { isPending: boolean; isError: boolean; refetch: () => unknown }) => {
    if (query.isPending) return <ListSkeleton rows={3} />;
    if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
    const templates = rows.filter((r) => r.clientId === null);
    const forClients = rows.filter((r) => r.clientId !== null);
    const Icon = kind === "workout" ? DumbbellIcon : UtensilsIcon;
    const card = (r: Row) => (
      <Card key={r.id}>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{r.name}</p>
              <p className="text-xs text-muted-foreground">
                {r.clientId ? t("forClient", { name: clientName(r.clientId) }) : r.meta}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href={`/coach/plans/${kind}/${r.id}`}>
                <PencilIcon data-icon="inline-start" />
                {t("edit")}
              </Link>
            </Button>
            {!r.clientId && (
              <Button asChild size="sm" variant="ghost">
                <Link href={`/coach/plans/${kind}/${r.id}/assign`}>
                  <UsersRoundIcon data-icon="inline-start" />
                  {t("assign")}
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
    return (
      <div className="flex flex-col gap-8">
        <section>
          <SectionTitle>{t("templates")}</SectionTitle>
          {templates.length === 0 ? (
            <EmptyState icon={BookmarkIcon} title={t("noTemplates")} />
          ) : (
            <div className="flex flex-col gap-3">{templates.map(card)}</div>
          )}
        </section>
        {forClients.length > 0 && (
          <section>
            <SectionTitle>{t("clientPlans")}</SectionTitle>
            <div className="flex flex-col gap-3">{forClients.map(card)}</div>
          </section>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title={t("title")} className="mb-2" />
      <Tabs defaultValue="workout">
        <div className="mb-4 flex flex-col gap-3">
          <TabsList className="w-full">
            <TabsTrigger value="workout">{t("workout")}</TabsTrigger>
            <TabsTrigger value="nutrition">{t("nutrition")}</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/coach/plans/nutrition/new">
                <PlusIcon data-icon="inline-start" />
                {t("newNutrition")}
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/coach/plans/workout/new">
                <PlusIcon data-icon="inline-start" />
                {t("newWorkout")}
              </Link>
            </Button>
          </div>
        </div>
        <TabsContent value="workout">{list("workout", workoutRows, programs)}</TabsContent>
        <TabsContent value="nutrition">{list("nutrition", nutritionRows, nutrition)}</TabsContent>
      </Tabs>
    </div>
  );
}
