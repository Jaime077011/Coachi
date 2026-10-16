/**
 * Mock stand-in for the jobs worker: important actions add an in-app notification for the person
 * they concern. Step 4 moves this to events + a job that also sends push.
 */
import type { NotificationType } from "@coachi/validation";
import { clients, coachClients, coachProfiles, notifications, profiles } from "./data";
import { newId, nowIso } from "./runtime";

/** English text for push/email; the app shows translated words from type + params. */
const plain: Record<NotificationType, (p: Record<string, string>) => [string, string]> = {
  request_new: (p) => ["New client request", `${p.name} wants to train with you.`],
  checkin_new: (p) => ["New check-in", `${p.name} sent this week's check-in.`],
  workout_done: (p) => ["Workout done", `${p.name} finished ${p.workout}.`],
  request_answered: (p) => [p.accepted === "yes" ? "Request accepted" : "Request declined", `${p.coach} answered your request.`],
  plan_assigned: (p) => ["New plan", `${p.coach} gave you ${p.plan}.`],
  checkin_reply: (p) => ["Your coach replied", `${p.coach} replied to your check-in.`],
};

export function notify(profileId: string | undefined, type: NotificationType, params: Record<string, string>, link: string | null) {
  if (!profileId) return;
  const [title, body] = plain[type](params);
  const stamp = nowIso();
  notifications.push({ id: newId(), profile_id: profileId, type, params, title, body, link, channel: "in_app", read_at: null, created_at: stamp, updated_at: stamp, deleted_at: null });
}

export const clientProfileId = (clientId: string) => clients.find((c) => c.id === clientId)?.profile_id;
export const nameOf = (profileId: string | undefined) => profiles.find((p) => p.id === profileId)?.name ?? "";

/** The coach a client trains with, as his coach profile. */
export function coachOfClient(clientId: string) {
  const link = coachClients.find((l) => l.client_id === clientId && !l.ended_at);
  return link ? coachProfiles.find((c) => c.id === link.coach_id) : undefined;
}
