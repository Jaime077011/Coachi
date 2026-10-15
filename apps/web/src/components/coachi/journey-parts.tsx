"use client";

import type { Milestone } from "@coachi/validation";
import { ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFmt } from "@/lib/format";
import { cn } from "@/lib/utils";

export type NextMilestone = Pick<Milestone, "type" | "value">;

/** Gradient dots for reached, outline dots for next, each with a date. */
export function MilestoneTimeline({ reached, next = [] }: { reached: Milestone[]; next?: NextMilestone[] }) {
  const t = useTranslations("parts.milestone");
  const fmt = useFmt();
  const label = (m: NextMilestone) =>
    m.type === "weight_change" && m.value !== null
      ? t("weight_change", { value: `${m.value > 0 ? "+" : ""}${fmt.num(m.value)}` })
      : t(m.type, { value: m.value ?? 0 });

  return (
    <ol className="relative flex flex-col gap-4 border-s-2 border-border ps-6">
      {reached.map((m) => (
        <li key={m.id} className="relative">
          <span className="absolute -start-[33px] top-1 size-4 rounded-full bg-fire ring-4 ring-background" aria-hidden />
          <p className="font-semibold">{label(m)}</p>
          <p className="text-xs text-hint">{fmt.date(m.reached_at)}</p>
        </li>
      ))}
      {next.map((m, i) => (
        <li key={`next-${i}`} className="relative opacity-70">
          <span className="absolute -start-[33px] top-1 size-4 rounded-full border-2 border-primary bg-background ring-4 ring-background" aria-hidden />
          <p className="font-semibold">{label(m)}</p>
          <p className="text-xs text-hint">{t("next")}</p>
        </li>
      ))}
    </ol>
  );
}

/** Day 1 photo and latest photo with a drag handle between them. */
export function ThenNowSlider({ before, after }: { before: string | null; after: string | null }) {
  const t = useTranslations("parts.thenNow");
  const [split, setSplit] = useState(50);

  if (!before || !after) {
    return (
      <div className="grid aspect-[4/5] grid-cols-2 overflow-hidden rounded-lg border">
        {[t("then"), t("now")].map((label, i) => (
          <div key={label} className={cn("flex flex-col items-center justify-center gap-2 bg-secondary text-hint", i === 0 && "border-e")}>
            <ImageIcon className="size-8" aria-hidden />
            <span className="text-xs font-semibold">{label}</span>
            <span className="text-xs">{t("noPhoto")}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    // Photos never flip; the slider always runs left (then) to right (now).
    <div className="relative aspect-[4/5] overflow-hidden rounded-lg border select-none" dir="ltr">
      {/* eslint-disable-next-line @next/next/no-img-element -- signed, private URLs */}
      <img src={after} alt={t("now")} className="absolute inset-0 size-full object-cover" />
      {/* eslint-disable-next-line @next/next/no-img-element -- signed, private URLs */}
      <img
        src={before}
        alt={t("then")}
        className="absolute inset-0 size-full object-cover"
        style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
      />
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white" style={{ insetInlineStart: `${split}%` }} />
      <input
        type="range"
        min={0}
        max={100}
        value={split}
        onChange={(e) => setSplit(Number(e.target.value))}
        aria-label={t("drag")}
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
