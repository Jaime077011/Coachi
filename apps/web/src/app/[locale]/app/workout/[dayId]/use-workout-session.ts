"use client";

import { api } from "@coachi/core";
import type { WorkoutDay, WorkoutSummary } from "@coachi/validation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { enqueue, flush, outboxStore } from "@/lib/outbox";

export type SetState = { id: string; weight: number | null; reps: number | null; done: boolean };

export type WorkoutState = {
  clientUuid: string;
  logId: string | null;
  startedAt: number;
  index: number;
  sets: Record<string, SetState[]>; // by program_exercise id
  notes: Record<string, string>;
};

const storageKey = (dayId: string) => `coachi.workout.${dayId}.${new Date().toISOString().slice(0, 10)}`;

function read(dayId: string): WorkoutState | null {
  try {
    const raw = localStorage.getItem(storageKey(dayId));
    return raw ? (JSON.parse(raw) as WorkoutState) : null;
  } catch {
    return null;
  }
}

function write(dayId: string, state: WorkoutState | null) {
  try {
    if (state) localStorage.setItem(storageKey(dayId), JSON.stringify(state));
    else localStorage.removeItem(storageKey(dayId));
  } catch {
    // Storage blocked: the server copy (every set is sent right away) is still there.
  }
}

/** First number of "8-12" / "AMRAP" / "45s" → a sensible pre-fill. */
const repsFrom = (reps: string) => {
  const n = parseInt(reps, 10);
  return Number.isNaN(n) ? null : n;
};

function initialSets(day: WorkoutDay): Record<string, SetState[]> {
  return Object.fromEntries(
    day.exercises.map(({ item, last_sets }) => [
      item.id,
      Array.from({ length: item.sets }, (_, i) => {
        const last = last_sets[i] ?? last_sets.at(-1);
        return {
          id: crypto.randomUUID(),
          weight: last?.weight_kg ?? null,
          reps: last?.reps ?? repsFrom(item.reps),
          done: false,
        };
      }),
    ]),
  );
}

/** Finish screen numbers worked out on the phone, for a workout finished offline. */
export function localSummary(state: WorkoutState): WorkoutSummary {
  const done = Object.values(state.sets).flat().filter((s) => s.done);
  return {
    workout_log_id: state.logId ?? "",
    duration_sec: Math.round((Date.now() - state.startedAt) / 1000),
    volume_kg: done.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0),
    sets_done: done.length,
    personal_bests: [],
    first_workout: false,
  };
}

/**
 * The in-progress workout. Lives in localStorage so a locked phone or reload loses nothing,
 * and every set goes through the outbox (lib/outbox): saved on the phone, sent when online.
 */
export function useWorkoutSession(clientId: string, dayId: string, day: WorkoutDay | undefined) {
  const [state, setState] = useState<WorkoutState | null>(null);
  const waiting = useSyncExternalStore(outboxStore.subscribe, outboxStore.getSnapshot, outboxStore.getServerSnapshot);
  const started = useRef(false);

  // Restore or create once the day has loaded.
  useEffect(() => {
    if (!day || state) return;
    const restored = read(dayId);
    const next: WorkoutState = restored ?? {
      clientUuid: crypto.randomUUID(),
      logId: null,
      startedAt: Date.now(),
      index: 0,
      sets: initialSets(day),
      notes: {},
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from storage
    setState(next);
  }, [day, dayId, state]);

  useEffect(() => {
    if (state) write(dayId, state);
  }, [dayId, state]);

  // Start (or re-confirm) the log on the server once per visit. Idempotent by client_uuid.
  // Offline it fails quietly: sets still queue, and the outbox starts the log when back online.
  useEffect(() => {
    if (!state || started.current || !clientId) return;
    started.current = true;
    void api.training
      .startWorkout(clientId, dayId, state.clientUuid)
      .then((log) => setState((s) => (s ? { ...s, logId: log.id } : s)))
      .catch(() => {});
  }, [state, clientId, dayId]);

  const update = useCallback((fn: (s: WorkoutState) => WorkoutState) => setState((s) => (s ? fn(s) : s)), []);

  const saveSet = useCallback(
    (exerciseItemId: string, exerciseId: string, setIndex: number, next: SetState, note?: string) => {
      update((s) => {
        const list = [...(s.sets[exerciseItemId] ?? [])];
        list[setIndex] = next;
        return { ...s, sets: { ...s.sets, [exerciseItemId]: list } };
      });
      const clientUuid = state?.clientUuid;
      if (!clientUuid || !clientId) return;
      void enqueue({
        kind: "set",
        ref: { clientId, dayId, clientUuid },
        set: { id: next.id, exercise_id: exerciseId, set_no: setIndex + 1, weight_kg: next.weight, reps: next.reps, done: next.done, note: note ?? null },
      });
    },
    [state?.clientUuid, clientId, dayId, update],
  );

  /**
   * Online: send what's waiting, then finish on the server (for PBs and the real summary).
   * Offline (or sets still waiting): queue the finish after the sets and return null.
   */
  const finishWorkout = useCallback(async (): Promise<WorkoutSummary | null> => {
    if (!state) return null;
    await flush();
    const ref = { clientId, dayId, clientUuid: state.clientUuid };
    if (!navigator.onLine || outboxStore.getSnapshot() > 0) {
      await enqueue({ kind: "finish", ref });
      return null;
    }
    const logId = state.logId ?? (await api.training.startWorkout(clientId, dayId, state.clientUuid)).id;
    return api.training.finishWorkout(logId);
  }, [state, clientId, dayId]);

  const clear = useCallback(() => write(dayId, null), [dayId]);

  return { state, update, saveSet, saving: waiting > 0, waiting, finishWorkout, clear };
}

/** Keep the screen on during a workout, where the phone supports it. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const acquire = () =>
      navigator.wakeLock
        .request("screen")
        .then((l) => (lock = l))
        .catch(() => {});
    void acquire();
    const onVisible = () => document.visibilityState === "visible" && void acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release();
    };
  }, [active]);
}
