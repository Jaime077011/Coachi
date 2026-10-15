"use client";

import { api } from "@coachi/core";
import type { JourneySummary } from "@coachi/validation";
import { useQuery } from "@tanstack/react-query";
import { AwardIcon, FlameIcon, LockIcon, MessageCircleHeartIcon, RocketIcon, Share2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { MilestoneTimeline, ThenNowSlider, type NextMilestone } from "@/components/coachi/journey-parts";
import { QueryState } from "@/components/coachi/query-state";
import { SectionTitle } from "@/components/coachi/screen-header";
import { ShareCardDialog, type ShareContent } from "@/components/coachi/share-card";
import { EmptyState } from "@/components/coachi/states";
import { GoalBar, StatBlock } from "@/components/coachi/stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/use-session";
import { useFmt, useLocalName } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

/** Where he started, how far he came, and what he won. Built to keep him going. */
export function JourneyScreen() {
  const { clientId } = useMe();
  const journey = useQuery({ queryKey: qk.journey(clientId), queryFn: () => api.journey.journey(clientId), enabled: !!clientId });
  return (
    <QueryState query={journey} skeleton={<JourneySkeleton />}>
      {(data) => <Journey data={data} />}
    </QueryState>
  );
}

function nextMilestones(data: JourneySummary): NextMilestone[] {
  const next: NextMilestone[] = [];
  const count = [10, 25, 50, 100].find((n) => n > data.workouts_done);
  if (count) next.push({ type: "workouts_count", value: count });
  if (data.start_weight_kg && data.current_weight_kg) {
    const change = data.current_weight_kg - data.start_weight_kg;
    const losing = (data.target_weight_kg ?? data.start_weight_kg) <= data.start_weight_kg;
    const step = Math.floor(Math.abs(change) / 2) * 2 + 2;
    next.push({ type: "weight_change", value: losing ? -step : step });
  }
  return next;
}

function Journey({ data }: { data: JourneySummary }) {
  const t = useTranslations("journey");
  const fmt = useFmt();
  const name = useLocalName();
  const [share, setShare] = useState<ShareContent | null>(null);

  if (data.workouts_done === 0) {
    return <EmptyState icon={RocketIcon} title={t("startTitle")} body={t("startBody")} className="mt-6" />;
  }

  const change =
    data.start_weight_kg != null && data.current_weight_kg != null ? data.current_weight_kg - data.start_weight_kg : null;
  const signed = (n: number) => `${n > 0 ? "+" : ""}${fmt.num(n)}`;
  const latest = data.milestones.at(-1);
  const badges = [
    { key: "firstWeek", got: data.day_number >= 7 },
    { key: "workouts10", got: data.workouts_done >= 10 },
    { key: "workouts25", got: data.workouts_done >= 25 },
    { key: "streak4", got: data.longest_streak_weeks >= 4 },
    { key: "firstPb", got: data.milestones.some((m) => m.type === "first_pb") },
    { key: "down5", got: change !== null && change <= -5 },
  ] as const;

  return (
    <div className="flex flex-col gap-8">
      <Card className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-fire" aria-hidden />
        <CardContent className="flex flex-col gap-2">
          <h1 className="font-display text-[34px] leading-[1.1] uppercase">
            {/* Numbers always in Anton: Badeen Display would draw Arabic-Indic digit shapes. */}
            {t.rich("day", { n: data.day_number, num: (chunks) => <span className="font-stat">{chunks}</span> })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("since", { date: fmt.date(data.started_at), coach: data.coach_name ?? "" })}
          </p>
          <p className="flex items-center gap-2 font-semibold">
            <FlameIcon className="size-6 text-primary" aria-hidden />
            <span className="font-stat text-2xl tabular-nums">{fmt.num(data.streak_weeks)}</span>
            <span className="text-sm text-muted-foreground">{t("streak", { count: data.streak_weeks })}</span>
          </p>
        </CardContent>
      </Card>

      <section>
        <SectionTitle>{t("thenNow")}</SectionTitle>
        <ThenNowSlider before={null} after={null} />
        {change !== null && (
          <p className="mt-3 text-center">
            <span className={cn("font-stat text-4xl tabular-nums", change < 0 ? "text-success" : "text-foreground")} dir="ltr">
              {signed(change)}
            </span>{" "}
            <span className="text-sm text-muted-foreground">{t("weightChange")}</span>
          </p>
        )}
      </section>

      <section>
        <SectionTitle>{t("bigNumbers")}</SectionTitle>
        <div className="grid grid-cols-2 gap-4 rounded-lg border bg-card p-4">
          <StatBlock value={fmt.num(data.workouts_done)} label={t("workouts")} />
          <StatBlock value={fmt.num(data.total_kg_lifted, 0)} label={t("kgLifted")} />
          <StatBlock value={fmt.num(data.meals_on_plan_month)} label={t("mealsOnPlan")} />
          <StatBlock value={fmt.num(data.longest_streak_weeks)} label={t("longestStreak")} />
        </div>
      </section>

      {data.start_weight_kg != null && data.current_weight_kg != null && data.target_weight_kg != null && (
        <section>
          <SectionTitle>{t("goal")}</SectionTitle>
          <div className="rounded-lg border bg-card p-4">
            <GoalBar start={data.start_weight_kg} now={data.current_weight_kg} target={data.target_weight_kg} />
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <SectionTitle className="mb-0">{t("milestones")}</SectionTitle>
          {latest && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setShare({
                  headline:
                    latest.type === "weight_change" && latest.value != null ? fmt.kg(latest.value) : fmt.num(data.workouts_done),
                  caption: t.markup("day", { n: data.day_number, num: (chunks) => chunks }),
                  coachName: data.coach_name,
                })
              }
            >
              <Share2Icon data-icon="inline-start" />
              {t("share")}
            </Button>
          )}
        </div>
        <MilestoneTimeline reached={data.milestones} next={nextMilestones(data)} />
      </section>

      {data.personal_bests.length > 0 && (
        <section>
          <SectionTitle>{t("pbs")}</SectionTitle>
          <ul className="divide-y rounded-lg border bg-card">
            {data.personal_bests.map((pb) => (
              <li key={pb.exercise.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{name(pb.exercise)}</p>
                  <p className="text-xs text-hint">{fmt.date(pb.reached_at)}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-stat text-2xl tabular-nums">{fmt.kg(pb.best_kg)}</span>
                  {pb.start_kg != null && pb.best_kg > pb.start_kg && (
                    <span className="text-xs font-semibold text-success tabular-nums">
                      {t("pbUp", { value: fmt.kg(pb.best_kg - pb.start_kg) })}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionTitle>{t("badges")}</SectionTitle>
        <ul className="grid grid-cols-3 gap-3">
          {badges.map((b) => (
            <li
              key={b.key}
              className={cn("flex flex-col items-center gap-2 rounded-lg border bg-card p-3 text-center", !b.got && "opacity-50")}
            >
              <span className={cn("grid size-12 place-items-center rounded-full", b.got ? "bg-fire" : "bg-secondary")}>
                {b.got ? <AwardIcon className="size-6 text-white" aria-hidden /> : <LockIcon className="size-5 text-hint" aria-hidden />}
              </span>
              <span className="text-xs font-semibold">{t(`badge.${b.key}`)}</span>
              {!b.got && <span className="sr-only">{t("locked")}</span>}
            </li>
          ))}
        </ul>
      </section>

      {data.coach_messages.length > 0 && (
        <section>
          <SectionTitle>{t("coachWords")}</SectionTitle>
          <div className="flex flex-col gap-3">
            {data.coach_messages.map((m) => (
              <Card key={m.id}>
                <CardContent className="flex gap-3">
                  <MessageCircleHeartIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p>{m.text}</p>
                    <p className="mt-1 text-xs text-hint">
                      <bdi>{data.coach_name}</bdi> · {fmt.relative(m.created_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {share && <ShareCardDialog open onOpenChange={(open) => !open && setShare(null)} content={share} />}
    </div>
  );
}

function JourneySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-36 rounded-lg" />
      <Skeleton className="aspect-[4/5] rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}
