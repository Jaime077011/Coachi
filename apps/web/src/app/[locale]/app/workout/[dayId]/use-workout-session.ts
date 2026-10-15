"use client";

import { api } from "@coachi/core";
import type { WorkoutDay } from "@coachi/validation";
import { useCallback, useEffect, useRef, useState } from "react";

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

/**
 * The in-progress workout. Lives in localStorage so a locked phone or reload loses nothing,
 * and every set is sent to the API the moment it changes (Dexie + sync queue in Step 4).
 */
export function useWorkoutSession(clientId: string, dayId: string, day: WorkoutDay | undefined) {
  const [state, setState] = useState<WorkoutState | null>(null);
  const [pending, setPending] = useState(0);
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

  // Start (or re-confirm) the log on the server once per visit. Idempotent by client_uuid,
  // so a restored workout always points at a log the server knows.
  useEffect(() => {
    if (!state || started.current || !clientId) return;
    started.current = true;
    void api.training.startWorkout(clientId, dayId, state.clientUuid).then((log) => {
      setState((s) => (s ? { ...s, logId: log.id } : s));
      // Re-send what this phone already has (safe: each set saves by its own id).
      for (const { item, exercise } of day?.exercises ?? []) {
        (state.sets[item.id] ?? []).forEach((set, i) => {
          if (!set.done) return;
          void api.training
            .logSet({ id: set.id, workout_log_id: log.id, exercise_id: exercise.id, set_no: i + 1, weight_kg: set.weight, reps: set.reps, done: true })
            .catch(() => {});
        });
      }
    });
  }, [state, clientId, dayId, day]);

  const update = useCallback((fn: (s: WorkoutState) => WorkoutState) => setState((s) => (s ? fn(s) : s)), []);

  const saveSet = useCallback(
    (exerciseItemId: string, exerciseId: string, setIndex: number, next: SetState, note?: string) => {
      update((s) => {
        const list = [...(s.sets[exerciseItemId] ?? [])];
        list[setIndex] = next;
        return { ...s, sets: { ...s.sets, [exerciseItemId]: list } };
      });
      const logId = state?.logId;
      if (!logId) return;
      setPending((p) => p + 1);
      void api.training
        .logSet({
          id: next.id,
          workout_log_id: logId,
          exercise_id: exerciseId,
          set_no: setIndex + 1,
          weight_kg: next.weight,
          reps: next.reps,
          done: next.done,
          note: note ?? null,
        })
        .catch(() => {
          // Kept locally; the Step 4 sync queue retries. Nothing is lost.
        })
        .finally(() => setPending((p) => p - 1));
    },
    [state?.logId, update],
  );

  const clear = useCallback(() => write(dayId, null), [dayId]);

  return { state, update, saveSet, saving: pending > 0, clear };
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
