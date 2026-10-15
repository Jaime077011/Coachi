"use client";

import { api, dayInProgram } from "@coachi/core";
import type { ProgramFull } from "@coachi/validation";
import { useQuery } from "@tanstack/react-query";
import { CalendarClockIcon, DumbbellIcon, InfoIcon, MoonIcon, PlayIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenHeader } from "@/components/coachi/screen-header";
import { EmptyState, ListSkeleton } from "@/components/coachi/states";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useMe } from "@/hooks/use-session";
import { Link } from "@/i18n/navigation";
import { useFmt, useLocalName } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

const DAY = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** The next 7 days from today, each mapped to its program day (the week repeats from starts_on). */
function weekAhead(program: ProgramFull, now: number) {
  const start = program.program.starts_on ? Date.parse(`${program.program.starts_on}T12:00:00`) : now;
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + i);
    const since = Math.floor((date.getTime() - start) / DAY);
    const found = since >= 0 ? dayInProgram(program.days.map((d) => ({ ...d.day, full: d })), program.program.weeks, since) : null;
    const day = found?.full ?? null;
    return { date: iso(date), day };
  });
}

export function PlanScreen() {
  const t = useTranslations("plan");
  const { clientId } = useMe();
  const program = useQuery({ queryKey: qk.clientProgram(clientId), queryFn: () => api.training.clientProgram(clientId), enabled: !!clientId });

  return (
    <div className="flex flex-col">
      <ScreenHeader title={t("title")} />
      <Tabs defaultValue="workouts">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="workouts" className="flex-1">
            {t("workouts")}
          </TabsTrigger>
          <TabsTrigger value="meals" className="flex-1">
            {t("meals")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="workouts">
          <QueryState query={program} isEmpty={(p) => p === null} empty={<EmptyState icon={DumbbellIcon} title={t("noPlan")} />}>
            {(p) => <Workouts program={p!} />}
          </QueryState>
        </TabsContent>
        <TabsContent value="meals">
          <Meals clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Workouts({ program }: { program: ProgramFull }) {
  const t = useTranslations("plan");
  const tToday = useTranslations("today");
  const fmt = useFmt();
  const name = useLocalName();
  const [now] = useState(() => Date.now());
  const week = weekAhead(program, now);
  const endsAt = program.program.starts_on
    ? Date.parse(`${program.program.starts_on}T12:00:00`) + program.program.weeks * 7 * DAY
    : null;
  const daysLeft = endsAt ? Math.ceil((endsAt - now) / DAY) : null;

  return (
    <div className="flex flex-col gap-3">
      {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
        <p className="flex items-center gap-2 rounded-lg bg-info/12 p-3 text-sm text-info">
          <InfoIcon className="size-4 shrink-0" aria-hidden />
          {t("endsSoon", { days: daysLeft })}
        </p>
      )}
      <Accordion type="single" collapsible defaultValue={week[0]!.date}>
        {week.map(({ date, day }, i) => (
          <AccordionItem key={date} value={date} className={cn("mb-2 rounded-lg border bg-card px-4 last:border-b", i === 0 && "border-primary/50")}>
            <AccordionTrigger className="hover:no-underline" disabled={!day || day.day.rest_day}>
              <span className="flex items-center gap-3 text-start">
                <span className="w-16 shrink-0 text-xs font-semibold text-muted-foreground">
                  {i === 0 ? t("today") : fmt.weekday(date)}
                  <span className="block text-hint tabular-nums">{fmt.date(date, "short")}</span>
                </span>
                {!day || day.day.rest_day ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <MoonIcon className="size-4" aria-hidden />
                    {t("restDay")}
                  </span>
                ) : (
                  <span className="flex flex-col">
                    <span className="font-semibold">{day.day.title}</span>
                    <span className="text-xs text-muted-foreground">{t("exercisesCount", { count: day.items.length })}</span>
                  </span>
                )}
              </span>
            </AccordionTrigger>
            {day && !day.day.rest_day && (
              <AccordionContent className="flex flex-col gap-3">
                <ul className="flex flex-col gap-2">
                  {day.items.map(({ item, exercise }) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <span>{name(exercise)}</span>
                      <span className="text-muted-foreground tabular-nums" dir="ltr">
                        {item.sets} × {item.reps}
                      </span>
                    </li>
                  ))}
                </ul>
                {i === 0 && (
                  <Button asChild size="sm" className="w-fit">
                    <Link href={`/app/workout/${day.day.id}`}>
                      <PlayIcon data-icon="inline-start" />
                      {tToday("start")}
                    </Link>
                  </Button>
                )}
              </AccordionContent>
            )}
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function Meals({ clientId }: { clientId: string }) {
  const t = useTranslations("plan");
  const tMeals = useTranslations("meals");
  const fmt = useFmt();
  const name = useLocalName();
  const [dates] = useState(() => Array.from({ length: 7 }, (_, i) => iso(new Date(Date.now() + i * DAY))));
  const [date, setDate] = useState(dates[0]!);
  const plan = useQuery({ queryKey: qk.meals(clientId, date), queryFn: () => api.nutrition.clientDay(clientId, date), enabled: !!clientId });

  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        type="single"
        variant="outline"
        value={date}
        onValueChange={(v) => v && setDate(v)}
        aria-label={t("pickDay")}
        className="grid w-full grid-cols-7"
      >
        {dates.map((d) => (
          <ToggleGroupItem key={d} value={d} className="h-14 flex-col gap-0 px-0 text-xs">
            <span>{fmt.weekday(d, "narrow")}</span>
            <span className="font-bold tabular-nums">{new Date(`${d}T12:00:00`).getDate()}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <QueryState
        query={plan}
        skeleton={<ListSkeleton rows={3} />}
        isEmpty={(p) => p === null}
        empty={<EmptyState icon={CalendarClockIcon} title={tMeals("noPlanTitle")} body={tMeals("noPlanBody")} />}
      >
        {(p) => (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-muted-foreground">
              {p!.plan.day_type === "rest" ? tMeals("restDay") : tMeals("trainingDay")} · {fmt.kcal(p!.plan.targets.kcal)}
            </p>
            {p!.meals.map((m) => (
              <div key={m.meal.id} className="rounded-lg border bg-card p-4">
                <p className="mb-2 font-semibold">{m.meal.name}</p>
                <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {m.items.map(({ item, food }, i) => (
                    <li key={item.id}>
                      {item.swap_group && i > 0 && m.items[i - 1]?.item.swap_group === item.swap_group && (
                        <span className="me-1 font-bold text-hint">{tMeals("swap")}</span>
                      )}
                      {name(food)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}
