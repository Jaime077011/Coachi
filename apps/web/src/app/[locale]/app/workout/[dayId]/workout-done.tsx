"use client";

import type { WorkoutSummary } from "@coachi/validation";
import { Share2Icon, TrophyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ShareCardDialog } from "@/components/coachi/share-card";
import { PBBadge, StatBlock } from "@/components/coachi/stats";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useFmt, useLocalName } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Time, total kg, sets, new PBs, a win message, and Share. The first workout ever gets a bigger moment. */
export function WorkoutDone({ summary }: { summary: WorkoutSummary }) {
  const t = useTranslations("done");
  const fmt = useFmt();
  const name = useLocalName();
  const [sharing, setSharing] = useState(false);
  const celebrate = summary.first_workout || summary.personal_bests.length > 0;
  const topPb = summary.personal_bests[0];

  return (
    <div className="flex min-h-dvh flex-col gap-8 px-4 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="flex flex-col items-center gap-4 text-center">
        <span
          className={cn(
            "grid place-items-center rounded-full bg-fire shadow-[0_0_60px_rgba(242,65,46,0.45)]",
            summary.first_workout ? "size-28" : "size-20",
            // One celebration moment, never on every set. Reduced motion: just a fade.
            celebrate && "motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-500 motion-reduce:animate-in motion-reduce:fade-in",
          )}
        >
          <TrophyIcon className={cn("text-white", summary.first_workout ? "size-14" : "size-10")} aria-hidden />
        </span>
        <h1 className="font-display text-[32px] leading-[1.15] uppercase">
          {summary.first_workout ? t("firstTitle") : t("title")}
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-4 rounded-lg border bg-card p-4 text-center">
        <StatBlock value={fmt.clock(summary.duration_sec)} label={t("time")} />
        <StatBlock value={fmt.num(summary.volume_kg, 0)} label={t("volume")} />
        <StatBlock value={fmt.num(summary.sets_done)} label={t("sets")} />
      </div>

      {summary.personal_bests.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-bold tracking-[0.12em] text-hint uppercase">{t("pbs")}</h2>
          {summary.personal_bests.map((pb) => (
            <PBBadge key={pb.exercise.id} name={name(pb.exercise)} weightKg={pb.weight_kg} />
          ))}
        </section>
      )}

      <div className="mt-auto flex flex-col gap-2">
        <Button size="lg" onClick={() => setSharing(true)}>
          <Share2Icon data-icon="inline-start" />
          {t("share")}
        </Button>
        <Button asChild variant="ghost">
          <Link href="/app/today">{t("backToday")}</Link>
        </Button>
      </div>

      <ShareCardDialog
        open={sharing}
        onOpenChange={setSharing}
        content={{
          headline: topPb ? fmt.kg(topPb.weight_kg) : fmt.num(summary.volume_kg, 0),
          caption: topPb ? name(topPb.exercise) : t("volume"),
          coachName: null,
        }}
      />
    </div>
  );
}
