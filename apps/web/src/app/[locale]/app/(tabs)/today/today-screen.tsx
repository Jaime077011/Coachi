"use client";

import { api } from "@coachi/core";
import type { ClientToday } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRightIcon,
  ClipboardCheckIcon,
  DropletIcon,
  DumbbellIcon,
  MessageCircleHeartIcon,
  MinusIcon,
  MoonIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  UtensilsIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { QueryState } from "@/components/coachi/query-state";
import { EmptyState } from "@/components/coachi/states";
import { MacroBar, WeekStrip } from "@/components/coachi/stats";
import { StatusChip } from "@/components/coachi/status-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/use-session";
import { Link } from "@/i18n/navigation";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { useNow } from "@/lib/use-now";

export function TodayScreen() {
  const t = useTranslations("today");
  const fmt = useFmt();
  const { clientId, session } = useMe();
  const today = useQuery({
    queryKey: qk.today(clientId),
    queryFn: () => api.journey.today(clientId),
    enabled: !!clientId,
  });
  const firstName = session?.profile.name.split(" ")[0] ?? "";
  const now = useNow();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <p className="min-h-5 text-sm text-muted-foreground">{now && fmt.date(new Date(now).toISOString(), "long")}</p>
        <h1 className="font-display text-[32px] leading-[1.1] uppercase">
          {t.rich("greeting", { name: firstName, n: (chunks) => <bdi>{chunks}</bdi> })}
        </h1>
      </header>
      <QueryState query={today} skeleton={<TodaySkeleton />}>
        {(data) =>
          !data.coach ? (
            <EmptyState
              icon={SearchIcon}
              title={t("noCoachTitle")}
              body={t("noCoachBody")}
              action={
                <Button asChild>
                  <Link href="/app/coaches">{t("browse")}</Link>
                </Button>
              }
            />
          ) : (
            <>
              {data.coach.logo_url && (
                <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- coach's logo from storage */}
                  <img src={data.coach.logo_url} alt="" className="size-10 rounded-md object-cover" />
                  <span className="text-sm text-muted-foreground">
                    {t.rich("coachedBy", { coach: data.coach.name, b: (chunks) => <bdi className="font-semibold text-foreground">{chunks}</bdi> })}
                  </span>
                </div>
              )}
              {data.week.length > 0 && <WeekStrip days={data.week} />}
              <WorkoutCard data={data} />
              {data.checkin_due && <CheckinCard />}
              {data.meals && <MealsCard meals={data.meals} />}
              <WaterCard clientId={clientId} date={data.date} glasses={data.water_glasses} />
              {data.coach_message && (
                <Card>
                  <CardContent className="flex gap-3">
                    <MessageCircleHeartIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {t("coachMessage")} · <bdi>{data.coach.name}</bdi>
                      </p>
                      <p>{data.coach_message}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )
        }
      </QueryState>
    </div>
  );
}

function WorkoutCard({ data }: { data: ClientToday }) {
  const t = useTranslations("today");
  const w = data.workout;

  if (!w) {
    return <EmptyState icon={DumbbellIcon} title={t("noPlanTitle")} body={t("noPlanBody")} />;
  }
  if (w.rest_day) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary">
            <MoonIcon className="size-6 text-info" aria-hidden />
          </span>
          <div>
            <p className="text-[17px] font-semibold">{t("restTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("restBody")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-semibold text-muted-foreground">{t("workout")}</p>
        <CardTitle className="font-display text-[28px] leading-tight uppercase">{w.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("exercises", { count: w.exercise_count })}</p>
      </CardHeader>
      <CardContent>
        {w.done ? (
          <StatusChip tone="success">{t("doneToday")}</StatusChip>
        ) : (
          <Button asChild size="lg" className="w-full">
            <Link href={`/app/workout/${w.day_id}`}>
              <PlayIcon data-icon="inline-start" />
              {t("start")}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function CheckinCard() {
  const t = useTranslations("today");
  return (
    <Link href="/app/check-in" className="block rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      <Card className="border-info/40">
        <CardContent className="flex items-center gap-3">
          <ClipboardCheckIcon className="size-6 shrink-0 text-info" aria-hidden />
          <div className="flex-1">
            <p className="font-semibold">{t("checkinDue")}</p>
            <p className="text-sm text-muted-foreground">{t("checkinBody")}</p>
          </div>
          <ChevronRightIcon className="size-5 text-hint rtl:rotate-180" aria-hidden />
        </CardContent>
      </Card>
    </Link>
  );
}

function MealsCard({ meals }: { meals: NonNullable<ClientToday["meals"]> }) {
  const t = useTranslations("today");
  const done = meals.meals.filter((m) => m.done).length;
  return (
    <Link href="/app/meals" className="block rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      <Card className="transition-colors hover:border-primary/40">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[17px] font-semibold">
            <UtensilsIcon className="size-5 text-muted-foreground" aria-hidden />
            {t("meals")}
          </CardTitle>
          <span className="flex items-center gap-1 text-sm font-semibold text-muted-foreground">
            {t("mealsDone", { done, total: meals.meals.length })}
            <ChevronRightIcon className="size-4 rtl:rotate-180" aria-hidden />
          </span>
        </CardHeader>
        <CardContent>
          <MacroBar eaten={meals.eaten} targets={meals.targets} />
        </CardContent>
      </Card>
    </Link>
  );
}

function WaterCard({ clientId, date, glasses }: { clientId: string; date: string; glasses: number }) {
  const t = useTranslations("today");
  const queryClient = useQueryClient();
  const water = useMutation({
    mutationFn: (delta: number) => api.journey.addWater(clientId, date, delta),
    // Update right away; roll back if the save fails.
    onMutate: async (delta) => {
      await queryClient.cancelQueries({ queryKey: qk.today(clientId) });
      const before = queryClient.getQueryData<ClientToday>(qk.today(clientId));
      queryClient.setQueryData<ClientToday>(qk.today(clientId), (old) =>
        old ? { ...old, water_glasses: Math.max(0, old.water_glasses + delta) } : old,
      );
      return { before };
    },
    onError: (_e, _d, ctx) => queryClient.setQueryData(qk.today(clientId), ctx?.before),
  });

  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <DropletIcon className="size-6 shrink-0 text-info" aria-hidden />
        <div className="flex-1">
          <p className="font-semibold">{t("water")}</p>
          <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
            {t("waterGlasses", { count: glasses })}
          </p>
        </div>
        <Button
          variant="secondary"
          size="icon"
          aria-label={t("removeGlass")}
          disabled={glasses === 0}
          onClick={() => water.mutate(-1)}
        >
          <MinusIcon />
        </Button>
        <Button variant="secondary" size="icon" aria-label={t("addGlass")} onClick={() => water.mutate(1)}>
          <PlusIcon />
        </Button>
      </CardContent>
    </Card>
  );
}

function TodaySkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-14 w-full rounded-lg" />
      <Skeleton className="h-44 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  );
}
