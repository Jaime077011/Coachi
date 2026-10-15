import type { ClientSummary, CoachToday } from "@coachi/validation";
import type { ClientsApi } from "./api";
import {
  DEMO,
  bodyMetrics,
  checkins,
  clientDetails,
  clients,
  coachClients,
  coachNotes,
  coachRequests,
  exercises,
  invites,
  planFeatures,
  profiles,
  programs,
  setLogs,
  subscriptions,
  workoutLogs,
} from "../mock/data";
import { ApiError, dateOnly, mockRead, mockWrite, newId, nowIso } from "../mock/runtime";

const profileOf = (clientId: string) => {
  const client = clients.find((c) => c.id === clientId);
  if (!client) throw new ApiError("not_found");
  return { client, profile: profiles.find((p) => p.id === client.profile_id)! };
};

const startOfWeek = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 1) % 7)); // weeks start Saturday in Egypt
  return d;
};

function summarize(clientId: string): ClientSummary {
  const { client, profile } = profileOf(clientId);
  const logs = workoutLogs.filter((l) => l.client_id === clientId && l.finished_at);
  const last = logs.at(-1)?.finished_at ?? null;
  const weekStart = startOfWeek();
  const doneThisWeek = logs.filter((l) => new Date(l.started_at) >= weekStart).length;
  const program = programs.find((p) => p.client_id === clientId);
  const daysSinceLast = last ? (Date.now() - new Date(last).getTime()) / 86_400_000 : Infinity;
  return {
    id: clientId,
    name: profile.name,
    avatar_url: profile.avatar_url,
    goal: client.goal,
    status: client.status,
    plan_name: program?.name ?? null,
    last_workout_at: last,
    adherence_done: doneThisWeek,
    adherence_planned: program ? 6 : 0,
    needs_attention: client.status === "active" && daysSinceLast > 3,
  };
}

const myClientIds = (coachId: string) =>
  coachClients.filter((l) => l.coach_id === coachId && l.ended_at === null).map((l) => l.client_id);

export const mockClients: ClientsApi = {
  list: (coachId) => mockRead(() => myClientIds(coachId).map(summarize), []),

  get: (clientId) =>
    mockRead(() => {
      const { client, profile } = profileOf(clientId);
      const link = coachClients.find((l) => l.client_id === clientId);
      return {
        client,
        profile: { name: profile.name, phone: profile.phone, avatar_url: profile.avatar_url },
        details: clientDetails.find((d) => d.client_id === clientId) ?? null,
        notes: coachNotes
          .filter((n) => n.client_id === clientId && !n.deleted_at)
          .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.created_at.localeCompare(a.created_at)),
        started_at: link?.started_at ?? client.created_at,
      };
    }),

  invite: (input) =>
    mockWrite(() => {
      const sub = subscriptions.find((s) => s.org_id === DEMO.orgId)!;
      const limit = planFeatures.find((f) => f.plan_id === sub.plan_id && f.key === "client_limit")?.value;
      if (typeof limit === "number" && myClientIds(DEMO.coachId).length >= limit) {
        throw new ApiError("limit_reached");
      }
      const code = `${input.name.split(" ")[0]}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
      invites.push({
        id: newId(),
        org_id: DEMO.orgId,
        coach_id: DEMO.coachId,
        code,
        name: input.name,
        phone: input.phone,
        expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        used_by: null,
        created_at: nowIso(),
        updated_at: nowIso(),
        deleted_at: null,
      });
      const origin = globalThis.location?.origin ?? "https://coachi.app";
      return { inviteUrl: `${origin}/join/${code}`, code };
    }),

  setStatus: (clientId, status) =>
    mockWrite(() => {
      profileOf(clientId).client.status = status;
    }),

  updateDetails: (clientId, patch) =>
    mockWrite(() => {
      const details = clientDetails.find((d) => d.client_id === clientId);
      if (!details) throw new ApiError("not_found");
      Object.assign(details, patch, { updated_at: nowIso() });
      return details;
    }),

  myDetails: (clientId) =>
    mockRead(() => ({
      client: profileOf(clientId).client,
      details: clientDetails.find((d) => d.client_id === clientId) ?? null,
    })),

  updateMyGoal: (clientId, input) =>
    mockWrite(() => {
      const { client } = profileOf(clientId);
      Object.assign(client, input, { updated_at: nowIso() });
      return client;
    }),

  addNote: (input) =>
    mockWrite(() => {
      const note = {
        ...input,
        id: newId(),
        coach_id: DEMO.coachId,
        created_at: nowIso(),
        updated_at: nowIso(),
        deleted_at: null,
      };
      coachNotes.push(note);
      return note;
    }),

  updateNote: (noteId, patch) =>
    mockWrite(() => {
      const note = coachNotes.find((n) => n.id === noteId);
      if (!note) throw new ApiError("not_found");
      Object.assign(note, patch, { updated_at: nowIso() });
      return note;
    }),

  deleteNote: (noteId) =>
    mockWrite(() => {
      const note = coachNotes.find((n) => n.id === noteId);
      if (note) note.deleted_at = nowIso(); // soft delete, so Undo can restore it
    }),

  progress: (clientId) =>
    mockRead(
      () => {
        const logs = workoutLogs.filter((l) => l.client_id === clientId);
        const byExercise = new Map<string, { date: string; weight_kg: number }[]>();
        for (const log of logs) {
          for (const set of setLogs.filter((s) => s.workout_log_id === log.id && s.weight_kg !== null)) {
            const points = byExercise.get(set.exercise_id) ?? [];
            const day = dateOnly(log.started_at);
            const existing = points.find((p) => p.date === day);
            if (existing) existing.weight_kg = Math.max(existing.weight_kg, set.weight_kg!);
            else points.push({ date: day, weight_kg: set.weight_kg! });
            byExercise.set(set.exercise_id, points);
          }
        }
        return {
          metrics: bodyMetrics.filter((m) => m.client_id === clientId),
          lifts: [...byExercise.entries()].slice(0, 4).map(([exerciseId, points]) => ({
            exercise: exercises.find((e) => e.id === exerciseId)!,
            points,
          })),
          checkins: checkins.filter((c) => c.client_id === clientId),
        };
      },
      { metrics: [], lifts: [], checkins: [] },
    ),

  coachToday: (coachId) =>
    mockRead<CoachToday>(
      () => {
        const summaries = myClientIds(coachId).map(summarize);
        const attention: CoachToday["needs_attention"] = [];
        for (const s of summaries) {
          if (s.needs_attention) {
            attention.push({ reason: "missed_workouts", client_id: s.id, request_id: null, name: s.name, detail: 2 });
          }
        }
        for (const c of checkins.filter((c) => !c.read_at)) {
          attention.push({
            reason: "unread_checkin",
            client_id: c.client_id,
            request_id: null,
            name: profileOf(c.client_id).profile.name,
            detail: null,
          });
        }
        const pending = coachRequests.filter((r) => r.coach_id === coachId && r.status === "sent");
        for (const r of pending) {
          const hours = Math.round((Date.now() - new Date(r.created_at).getTime()) / 3_600_000);
          if (hours >= 48) {
            attention.push({ reason: "request_waiting", client_id: null, request_id: r.id, name: r.client_name, detail: hours });
          }
        }
        const activity = workoutLogs
          .filter((l) => l.finished_at && myClientIds(coachId).includes(l.client_id))
          .slice(-5)
          .reverse()
          .map((l) => ({
            client_id: l.client_id,
            name: profileOf(l.client_id).profile.name,
            kind: "workout" as const,
            title: "Workout",
            at: l.finished_at!,
          }));
        return { needs_attention: attention, activity, new_requests: pending.length };
      },
      { needs_attention: [], activity: [], new_requests: 0 },
    ),
};
