"use client";

import { api } from "@coachi/core";
import type { WorkoutDay, WorkoutSummary } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon, CircleCheckIcon, FlagIcon, Loader2Icon, PlayCircleIcon, WifiOffIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { use, useState } from "react";
import { toast } from "sonner";
import { QueryState } from "@/components/coachi/query-state";
import { ResponsiveDialog } from "@/components/coachi/responsive-dialog";
import { RestTimer } from "@/components/coachi/rest-timer";
import { SetRow } from "@/components/coachi/set-row";
import { ErrorState, OfflineBanner, useOnline } from "@/components/coachi/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/hooks/use-session";
import { useRouter } from "@/i18n/navigation";
import { useFmt, useLocalName } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { WorkoutDone } from "./workout-done";
import { localSummary, useWakeLock, useWorkoutSession } from "./use-workout-session";

export function WorkoutScreen({ params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = use(params);
  const { clientId } = useMe();
  const day = useQuery({
    queryKey: qk.workoutDay(clientId, dayId),
    queryFn: () => api.training.workoutDay(clientId, dayId),
    enabled: !!clientId,
  });
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);

  if (summary) return <WorkoutDone summary={summary} />;
  return (
    <QueryState query={day}>
      {(data) => <WorkoutRunner clientId={clientId} dayId={dayId} day={data} onFinished={setSummary} />}
    </QueryState>
  );
}

function WorkoutRunner({
  clientId,
  dayId,
  day,
  onFinished,
}: {
  clientId: string;
  dayId: string;
  day: WorkoutDay;
  onFinished: (summary: WorkoutSummary) => void;
}) {
  const t = useTranslations("workout");
  const tStates = useTranslations("states");
  const tCommon = useTranslations("common");
  const fmt = useFmt();
  const name = useLocalName();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { state, update, saveSet, saving, waiting, finishWorkout, clear } = useWorkoutSession(clientId, dayId, day);
  const [rest, setRest] = useState<{ endsAt: number; total: number } | null>(null);
  const [leaving, setLeaving] = useState(false);
  useWakeLock(true);
  const online = useOnline();

  const finish = useMutation({
    mutationFn: finishWorkout,
    onSuccess: (summary) => {
      const done = summary ?? localSummary(state!);
      // Finished offline: the outbox sends it later. Say so, so he doesn't redo it.
      if (!summary) toast(t("savedOffline"));
      clear();
      void queryClient.invalidateQueries({ queryKey: qk.today(clientId) });
      void queryClient.invalidateQueries({ queryKey: qk.journey(clientId) });
      onFinished(done);
    },
    onError: () =>
      toast.error(tStates("errorTitle"), {
        action: { label: tCommon("tryAgain"), onClick: () => finish.mutate() },
      }),
  });

  if (day.exercises.length === 0) return <ErrorState onRetry={() => router.replace("/app/today")} />;
  if (!state) return null;

  const total = day.exercises.length;
  const index = Math.min(state.index, total - 1);
  const { item, exercise, last_sets } = day.exercises[index]!;
  const sets = state.sets[item.id] ?? [];
  const isLast = index === total - 1;
  const note = state.notes[item.id] ?? "";

  const go = (next: number) => update((s) => ({ ...s, index: next }));

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="sticky top-0 z-20 bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <OfflineBanner />
        <div className="flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" aria-label={t("leaveTitle")} onClick={() => setLeaving(true)}>
            <XIcon />
          </Button>
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>{t("progress", { current: index + 1, total })}</span>
              <span className="flex items-center gap-1 text-hint" aria-live="polite">
                {saving && !online ? (
                  <>
                    <WifiOffIcon className="size-3" aria-hidden />
                    {t("waiting", { count: waiting })}
                  </>
                ) : saving ? (
                  <>
                    <Loader2Icon className="size-3 animate-spin" aria-hidden />
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <CircleCheckIcon className="size-3" aria-hidden />
                    {t("saved")}
                  </>
                )}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-fire transition-[width]" style={{ width: `${((index + 1) / total) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      <section className="flex flex-1 flex-col gap-4 px-4 pb-4">
        <div className="flex aspect-video items-center justify-center rounded-lg border bg-secondary text-hint">
          {exercise.video_url ? (
            <a href={exercise.video_url} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 font-semibold">
              <PlayCircleIcon className="size-12" aria-hidden />
              {t("video")}
            </a>
          ) : (
            <span className="text-sm">{t("noVideo")}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {item.group && (
            <Badge variant="outline" className="w-fit border-primary/40 text-primary">
              {t("superset", { group: item.group })}
            </Badge>
          )}
          <h1 className="text-2xl font-bold">{name(exercise)}</h1>
          <p className="text-sm text-muted-foreground tabular-nums">
            {item.sets} × {item.reps} · {t("rest", { time: fmt.clock(item.rest_sec) })}
            {item.target && <> · {t("target", { target: item.target })}</>}
          </p>
          {item.note && <p className="text-sm">{item.note}</p>}
        </div>

        <ol className="flex flex-col gap-2">
          {sets.map((set, i) => (
            <li key={set.id}>
              <SetRow
                setNo={i + 1}
                last={last_sets[i]}
                weight={set.weight}
                reps={set.reps}
                done={set.done}
                onWeight={(weight) => saveSet(item.id, exercise.id, i, { ...set, weight })}
                onReps={(reps) => saveSet(item.id, exercise.id, i, { ...set, reps })}
                onDone={() => {
                  const done = !set.done;
                  saveSet(item.id, exercise.id, i, { ...set, done });
                  if (done) {
                    navigator.vibrate?.(30);
                    if (item.rest_sec > 0) setRest({ endsAt: Date.now() + item.rest_sec * 1000, total: item.rest_sec });
                  }
                }}
              />
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ex-note" className="text-sm font-semibold">
            {t("note")}
          </label>
          <Textarea
            id="ex-note"
            value={note}
            placeholder={t("notePlaceholder")}
            onChange={(e) => update((s) => ({ ...s, notes: { ...s.notes, [item.id]: e.target.value } }))}
            onBlur={() => {
              const first = sets[0];
              if (first && note) saveSet(item.id, exercise.id, 0, first, note);
            }}
          />
        </div>
      </section>

      <footer className="sticky bottom-0 flex gap-2 border-t bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <Button variant="secondary" size="icon" aria-label={t("prev")} disabled={index === 0} onClick={() => go(index - 1)}>
          <ChevronLeftIcon className="rtl:rotate-180" />
        </Button>
        {isLast ? (
          <Button className="flex-1" disabled={finish.isPending} onClick={() => finish.mutate()}>
            {finish.isPending ? <Loader2Icon className="animate-spin" /> : <FlagIcon data-icon="inline-start" />}
            {t("finish")}
          </Button>
        ) : (
          <Button className="flex-1" onClick={() => go(index + 1)}>
            {t("next")}
            <ChevronRightIcon data-icon="inline-end" className="rtl:rotate-180" />
          </Button>
        )}
      </footer>

      <RestTimer
        endsAt={rest?.endsAt ?? null}
        total={rest?.total ?? 0}
        onAdd={(s) => setRest((r) => (r ? { endsAt: r.endsAt + s * 1000, total: r.total + s } : r))}
        onClose={() => setRest(null)}
      />

      <ResponsiveDialog
        open={leaving}
        onOpenChange={setLeaving}
        title={t("leaveTitle")}
        description={t("leaveBody")}
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => router.push("/app/today")}>
              {t("keep")}
            </Button>
            <Button
              disabled={finish.isPending}
              onClick={() => {
                setLeaving(false);
                finish.mutate();
              }}
            >
              {t("finishNow")}
            </Button>
          </div>
        }
      />
    </div>
  );
}
