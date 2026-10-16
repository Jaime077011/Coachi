import { memberCan, type ClientSummary, type CoachToday } from "@coachi/validation";
import type { ClientExportRow, ClientsApi } from "./api";
import {
  DEMO,
  bodyMetrics,
  checkins,
  clientDetails,
  clientGyms,
  clients,
  coachClients,
  coachNotes,
  coachRequests,
  exercises,
  invites,
  mealLogs,
  milestones,
  orgMembers,
  profiles,
  programs,
  setLogs,
  subscriptions,
  workoutLogs,
} from "../mock/data";
import { ApiError, dateOnly, mockRead, mockWrite, newId, nowIso } from "../mock/runtime";
import { canSeeClient, mockSession, requireActiveSubscription, requireMember, visibleLinks } from "../mock/session";

/** Coach side: like a row rule, a team member only reads clients he may see. */
const ensureVisible = (clientId: string) => {
  if (!canSeeClient(clientId)) throw new ApiError("forbidden");
};

/** The client himself, or a coach who may see him (and edit him, when asked). */
const ensureOwnOrCoach = (clientId: string, edit: boolean) => {
  const session = mockSession();
  if (session.profile.role === "client") {
    if (session.client_id !== clientId) throw new ApiError("forbidden");
    return;
  }
  if (edit) requireMember("client_edit");
  ensureVisible(clientId);
};

const assigneeOf = (clientId: string) => {
  const link = coachClients.find((l) => l.client_id === clientId && !l.ended_at);
  const member = link?.assigned_member_id ? orgMembers.find((m) => m.id === link.assigned_member_id && m.status === "active") : null;
  if (!member) return null;
  return { member_id: member.id, name: profiles.find((p) => p.id === member.profile_id)?.name ?? "" };
};

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
    assigned_to: assigneeOf(clientId),
  };
}

const myClientIds = (coachId: string) => visibleLinks(coachId).map((l) => l.client_id);

export const mockClients: ClientsApi = {
  exportMine: (clientId) =>
    mockRead(() => {
      ensureOwnOrCoach(clientId, false);
      const { client, profile } = profileOf(clientId);
      const logs = workoutLogs.filter((l) => l.client_id === clientId);
      return {
        exported_at: nowIso(),
        profile,
        client,
        details: clientDetails.find((d) => d.client_id === clientId) ?? null,
        gym: clientGyms.find((g) => g.client_id === clientId) ?? null,
        workouts: logs.map((log) => ({ log, sets: setLogs.filter((s) => s.workout_log_id === log.id) })),
        meal_logs: mealLogs.filter((m) => m.client_id === clientId),
        body_metrics: bodyMetrics.filter((m) => m.client_id === clientId),
        checkins: checkins.filter((c) => c.client_id === clientId),
        milestones: milestones.filter((m) => m.client_id === clientId),
      };
    }),

  exportClients: (coachId) =>
    mockRead(
      () =>
        myClientIds(coachId).map((clientId): ClientExportRow => {
          const { client, profile } = profileOf(clientId);
          const d = clientDetails.find((x) => x.client_id === clientId);
          const gym = clientGyms.find((g) => g.client_id === clientId);
          const logs = workoutLogs.filter((l) => l.client_id === clientId && l.finished_at);
          const weights = bodyMetrics.filter((m) => m.client_id === clientId && m.weight_kg !== null).sort((a, b) => a.date.localeCompare(b.date));
          return {
            name: profile.name,
            phone: profile.phone,
            status: client.status,
            goal: client.goal,
            started_at: coachClients.find((l) => l.client_id === clientId && !l.ended_at)?.started_at ?? null,
            assigned_to: assigneeOf(clientId)?.name ?? null,
            age: d?.age ?? null,
            gender: d?.gender ?? null,
            height_cm: d?.height_cm ?? null,
            start_weight_kg: d?.start_weight_kg ?? null,
            latest_weight_kg: weights.at(-1)?.weight_kg ?? null,
            target_weight_kg: client.target_weight_kg,
            training_days: d?.training_days ?? [],
            place: d?.place ?? null,
            gym_name: gym?.gym_name ?? null,
            gym_items: gym ? [...gym.items, ...gym.custom_items] : [],
            injuries: d?.injuries ?? null,
            health_notes: d?.health_notes ?? null,
            medicines: d?.medicines ?? null,
            food_likes: d?.food_likes ?? null,
            food_dislikes: d?.food_dislikes ?? null,
            food_never: d?.food_never ?? null,
            meals_per_day: d?.meals_per_day ?? null,
            workouts_done: logs.length,
            last_workout_at: logs.at(-1)?.finished_at ?? null,
            notes: coachNotes.filter((n) => n.client_id === clientId && !n.deleted_at).map((n) => n.text),
          };
        }),
      [],
    ),

  list: (coachId) => mockRead(() => myClientIds(coachId).map(summarize), []),

  get: (clientId) =>
    mockRead(() => {
      ensureVisible(clientId);
      const { client, profile } = profileOf(clientId);
      const link = coachClients.find((l) => l.client_id === clientId && !l.ended_at);
      return {
        client,
        profile: { name: profile.name, phone: profile.phone, avatar_url: profile.avatar_url },
        details: clientDetails.find((d) => d.client_id === clientId) ?? null,
        gym: clientGyms.find((g) => g.client_id === clientId) ?? null,
        notes: coachNotes
          .filter((n) => n.client_id === clientId && !n.deleted_at)
          .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.created_at.localeCompare(a.created_at))
          .map((n) => ({ ...n, author_name: profiles.find((p) => p.id === n.author_id)?.name ?? null })),
        started_at: link?.started_at ?? client.created_at,
        assigned_member_id: link?.assigned_member_id ?? null,
      };
    }),

  invite: (input) =>
    mockWrite(() => {
      requireMember("clients_invite");
      requireActiveSubscription();
      const sub = subscriptions.find((s) => s.org_id === DEMO.orgId)!;
      // One client seat per client (pending invites hold one too).
      const clientCount =
        coachClients.filter((l) => l.org_id === DEMO.orgId && !l.ended_at).length +
        invites.filter((i) => i.org_id === DEMO.orgId && i.kind === "client" && !i.used_by && !i.deleted_at && Date.parse(i.expires_at) > Date.now()).length;
      if (clientCount >= sub.client_seats) {
        throw new ApiError("limit_reached");
      }
      const code = `${input.name.split(" ")[0]}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
      invites.push({
        id: newId(),
        org_id: DEMO.orgId,
        coach_id: DEMO.coachId,
        kind: "client",
        member_role: null,
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
      requireMember("client_edit");
      profileOf(clientId).client.status = status;
    }),

  updateDetails: (clientId, patch) =>
    mockWrite(() => {
      requireMember("client_edit");
      ensureVisible(clientId);
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

  updateMyDetails: (clientId, patch) =>
    mockWrite(() => {
      ensureOwnOrCoach(clientId, true);
      const details = clientDetails.find((d) => d.client_id === clientId);
      if (!details) throw new ApiError("not_found");
      Object.assign(details, patch, { updated_at: nowIso() });
      return details;
    }),

  gym: (clientId) =>
    mockRead(() => {
      ensureOwnOrCoach(clientId, false);
      return clientGyms.find((g) => g.client_id === clientId) ?? null;
    }, null),

  saveGym: (clientId, input) =>
    mockWrite(() => {
      ensureOwnOrCoach(clientId, true);
      const existing = clientGyms.find((g) => g.client_id === clientId);
      if (existing) {
        Object.assign(existing, input, { updated_at: nowIso() });
        return existing;
      }
      const gym = { ...input, id: newId(), client_id: clientId, created_at: nowIso(), updated_at: nowIso(), deleted_at: null };
      clientGyms.push(gym);
      return gym;
    }),

  updateMyGoal: (clientId, input) =>
    mockWrite(() => {
      const { client } = profileOf(clientId);
      Object.assign(client, input, { updated_at: nowIso() });
      return client;
    }),

  addNote: (input) =>
    mockWrite(() => {
      const session = requireMember("client_edit");
      ensureVisible(input.client_id);
      const note = {
        ...input,
        id: newId(),
        coach_id: DEMO.coachId,
        author_id: session.profile.id,
        created_at: nowIso(),
        updated_at: nowIso(),
        deleted_at: null,
      };
      coachNotes.push(note);
      return note;
    }),

  updateNote: (noteId, patch) =>
    mockWrite(() => {
      requireMember("client_edit");
      const note = coachNotes.find((n) => n.id === noteId);
      if (!note) throw new ApiError("not_found");
      Object.assign(note, patch, { updated_at: nowIso() });
      return note;
    }),

  deleteNote: (noteId) =>
    mockWrite(() => {
      requireMember("client_edit");
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
        const visible = new Set(myClientIds(coachId));
        const seesRequests = memberCan(mockSession().member_role, "requests");
        for (const c of checkins.filter((c) => !c.read_at && visible.has(c.client_id))) {
          attention.push({
            reason: "unread_checkin",
            client_id: c.client_id,
            request_id: null,
            name: profileOf(c.client_id).profile.name,
            detail: null,
          });
        }
        const pending = seesRequests ? coachRequests.filter((r) => r.coach_id === coachId && r.status === "sent") : [];
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
