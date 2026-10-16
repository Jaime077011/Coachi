"use client";

import { api, ApiError } from "@coachi/core";
import Dexie, { type EntityTable } from "dexie";

/**
 * Offline-safe workout logging. Every set (and the finish) goes into an outbox on the phone
 * (IndexedDB via Dexie) first, then is sent in order. No connection, a locked phone, or a closed
 * tab loses nothing: the outbox is sent when the app is open and online again.
 *
 * Ops carry the workout's client_uuid, not the server log id: startWorkout is idempotent by
 * client_uuid, so sending can always get (or make) the right log first, even when the workout
 * was started offline.
 */
type WorkoutRef = { clientId: string; dayId: string; clientUuid: string };

export type NewOutboxOp =
  | { kind: "set"; ref: WorkoutRef; set: { id: string; exercise_id: string; set_no: number; weight_kg: number | null; reps: number | null; done: boolean; note: string | null } }
  | { kind: "finish"; ref: WorkoutRef };
export type OutboxOp = NewOutboxOp & { id?: number; tries: number };

const db = new Dexie("coachi-outbox") as Dexie & { ops: EntityTable<OutboxOp, "id"> };
db.version(1).stores({ ops: "++id, kind" });

const MAX_TRIES = 5;
const listeners = new Set<() => void>();
let count = 0;

async function refreshCount() {
  try {
    count = await db.ops.count();
  } catch {
    count = 0;
  }
  for (const l of listeners) l();
}

/** For useSyncExternalStore: how many ops are still waiting on this phone. */
export const outboxStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => count,
  getServerSnapshot: () => 0,
};

export async function enqueue(op: NewOutboxOp) {
  try {
    // A newer save of the same set replaces the waiting one.
    if (op.kind === "set") {
      const setId = op.set.id;
      await db.ops.filter((o) => o.kind === "set" && o.set.id === setId).delete();
    }
    await db.ops.add({ ...op, tries: 0 });
  } catch {
    // IndexedDB blocked (private mode): send straight away instead.
    await sendOne({ ...op, tries: 0 }).catch(() => {});
  }
  await refreshCount();
  void flush();
}

const logIds = new Map<string, string>();
async function logIdFor(ref: WorkoutRef) {
  const known = logIds.get(ref.clientUuid);
  if (known) return known;
  const log = await api.training.startWorkout(ref.clientId, ref.dayId, ref.clientUuid);
  logIds.set(ref.clientUuid, log.id);
  return log.id;
}

async function sendOne(op: OutboxOp) {
  const logId = await logIdFor(op.ref);
  if (op.kind === "set") await api.training.logSet({ ...op.set, workout_log_id: logId });
  else await api.training.finishWorkout(logId);
}

let flushing: Promise<void> | null = null;

async function sendWaiting() {
  try {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    // Primary-key order = the order they were saved.
    const ops = await db.ops.toArray();
    for (const op of ops) {
      try {
        await sendOne(op);
        await db.ops.delete(op.id!);
      } catch (error) {
        if (error instanceof ApiError && error.code === "network") break;
        // Rejected for another reason (not found, not allowed): retry a few times, then drop.
        if (op.tries + 1 >= MAX_TRIES) await db.ops.delete(op.id!);
        else await db.ops.update(op.id!, { tries: op.tries + 1 });
      }
    }
  } catch {
    // IndexedDB unavailable: nothing waiting here.
  } finally {
    await refreshCount();
  }
}

/** Sends waiting ops in order, one run at a time. Stops at the first network failure and tries again later. */
export function flush() {
  // The lock is released by the stored promise itself, so an early return can't leave it held.
  flushing ??= sendWaiting().finally(() => {
    flushing = null;
  });
  return flushing;
}

/** Send on load and whenever the connection comes back. Called once by the client shell. */
export function startOutbox() {
  void refreshCount().then(flush);
  const onOnline = () => void flush();
  window.addEventListener("online", onOnline);
  const timer = window.setInterval(onOnline, 30_000);
  return () => {
    window.removeEventListener("online", onOnline);
    window.clearInterval(timer);
  };
}
