"use client";

import type { MacroTargets, MacroTotals, WeekStripDay } from "@coachi/validation";
import { CheckIcon, MoonIcon, TrophyIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFmt } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Big Anton number + small label, optional change ("+5 kg"). */
export function StatBlock({
  value,
  label,
  change,
  className,
}: {
  value: string;
  label: string;
  change?: { text: string; good: boolean };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="font-stat text-4xl leading-none tabular-nums lg:text-5xl" dir="ltr">
        <bdi>{value}</bdi>
      </span>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {change && (
        <span className={cn("text-xs font-semibold tabular-nums", change.good ? "text-success" : "text-warning")}>
          <bdi>{change.text}</bdi>
        </span>
      )}
    </div>
  );
}

/** A labelled bar: track surface-2, fire fill (or warning when over). Fills from the start edge. */
function Bar({ value, max, over }: { value: number; max: number; over?: boolean }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 overflow-hidden rounded-full bg-secondary">
      <div
        className={cn("h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none", over ? "bg-warning" : "bg-fire")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Calories and protein (or all four) against targets. Warning color when over, never blocks. */
export function MacroBar({
  eaten,
  targets,
  full = false,
  className,
}: {
  eaten: MacroTotals;
  targets: Pick<MacroTargets, "kcal" | "protein" | "carbs" | "fat">;
  full?: boolean;
  className?: string;
}) {
  const t = useTranslations("parts.macros");
  const fmt = useFmt();
  const rows = (full ? (["kcal", "protein", "carbs", "fat"] as const) : (["kcal", "protein"] as const)).map((key) => ({
    key,
    eaten: eaten[key],
    target: targets[key],
  }));
  return (
    <div className={cn("grid gap-3", full ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2", className)}>
      {rows.map((r) => {
        const over = r.eaten > r.target * 1.05;
        return (
          <div key={r.key} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="font-semibold text-muted-foreground">{t(r.key)}</span>
              <span className={cn("font-semibold tabular-nums", over && "text-warning")} dir="ltr">
                {t("of", { eaten: fmt.num(r.eaten, 0), target: fmt.num(r.target, 0) })}
              </span>
            </div>
            <Bar value={r.eaten} max={r.target} over={over} />
            {over && <span className="sr-only">{t("over")}</span>}
          </div>
        );
      })}
    </div>
  );
}

const dayStyles: Record<WeekStripDay["state"], string> = {
  done: "bg-fire text-white border-transparent",
  missed: "border-destructive/50 text-destructive",
  today: "border-primary border-2 text-foreground",
  upcoming: "border-border text-muted-foreground",
  rest: "border-dashed border-border text-hint",
};

const dayIcons = { done: CheckIcon, missed: XIcon, rest: MoonIcon } as const;

/** 7 days: done, missed, today, upcoming, rest. */
export function WeekStrip({ days, className }: { days: WeekStripDay[]; className?: string }) {
  const t = useTranslations("parts.week");
  const fmt = useFmt();
  return (
    <ol className={cn("grid grid-cols-7 gap-1.5", className)}>
      {days.map((d) => {
        const Icon = d.state in dayIcons ? dayIcons[d.state as keyof typeof dayIcons] : null;
        return (
          <li key={d.date} className="flex flex-col items-center gap-1">
            <span className={cn("text-[11px] font-semibold rtl:text-xs", d.state === "today" ? "text-primary" : "text-hint")}>
              {fmt.weekday(d.date, "narrow")}
            </span>
            <span
              className={cn("grid size-9 place-items-center rounded-full border text-xs font-bold tabular-nums", dayStyles[d.state])}
              title={t(d.state)}
            >
              {Icon ? <Icon className="size-4" aria-hidden /> : new Date(`${d.date}T12:00:00`).getDate()}
              <span className="sr-only">{t(d.state)}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** This week's done vs planned: a small bar and "3 of 4". */
export function AdherenceBar({ done, planned, className }: { done: number; planned: number; className?: string }) {
  const t = useTranslations("parts");
  const fmt = useFmt();
  const pct = planned > 0 ? Math.min(100, (done / planned) * 100) : 0;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-fire" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-muted-foreground tabular-nums">
        {t("adherence", { done: fmt.num(done), planned: fmt.num(planned) })}
      </span>
    </div>
  );
}

/** Start, now, and target weight on one fire bar. */
export function GoalBar({ start, now, target }: { start: number; now: number; target: number }) {
  const t = useTranslations("parts.goal");
  const fmt = useFmt();
  const total = Math.abs(start - target);
  const done = Math.min(total, Math.abs(start - now));
  const pct = total > 0 ? (done / total) * 100 : 100;
  const left = Math.max(0, Math.abs(now - target));
  return (
    <div className="flex flex-col gap-2">
      <div className="h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={Math.round(pct)}>
        <div className="h-full rounded-full bg-fire" style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-3 text-xs">
        <Point label={t("start")} value={fmt.kg(start)} />
        <Point label={t("now")} value={fmt.kg(now)} className="items-center text-center" />
        <Point label={t("target")} value={fmt.kg(target)} className="items-end text-end" />
      </div>
      <p className="text-sm font-semibold">{left < 0.1 ? t("reached") : t("left", { value: fmt.num(left) })}</p>
    </div>
  );
}

function Point({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-hint">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

/** Fire trophy + the lift and new weight. */
export function PBBadge({ name, weightKg, className }: { name: string; weightKg: number; className?: string }) {
  const t = useTranslations("parts");
  const fmt = useFmt();
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border bg-card p-3", className)}>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-fire">
        <TrophyIcon className="size-5 text-white" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs font-semibold text-muted-foreground">{t("pb")}</span>
        <span className="truncate font-semibold">
          {name} · <span className="tabular-nums">{fmt.kg(weightKg)}</span>
        </span>
      </div>
    </div>
  );
}
