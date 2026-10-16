import { z } from "zod";
import { base, id, orgScoped, phone, timestamp } from "./common";

export const eventType = z.enum([
  "workout_logged",
  "set_logged",
  "meal_logged",
  "checkin_sent",
  "request_sent",
  "request_answered",
  "plan_assigned",
  "client_joined",
  "payment_recorded",
]);
export type EventType = z.infer<typeof eventType>;

/** Important actions write an event; the jobs worker reacts (milestones, streaks, alerts). */
export const event = z.object({
  id,
  org_id: id.nullable(),
  type: eventType,
  actor_id: id,
  subject_id: id.nullable(),
  payload: z.record(z.string(), z.unknown()),
  created_at: timestamp,
  processed_at: timestamp.nullable(),
});
export type AppEvent = z.infer<typeof event>;

export const notificationChannel = z.enum(["in_app", "push", "email", "whatsapp"]);

/** What happened. The screen words come from the type + params, in the reader's language. */
export const notificationType = z.enum([
  // Coach
  "request_new",
  "checkin_new",
  "workout_done",
  // Client
  "request_answered",
  "plan_assigned",
  "checkin_reply",
]);
export type NotificationType = z.infer<typeof notificationType>;

export const notification = base.extend({
  profile_id: id,
  type: notificationType,
  /** Names and values for the words, e.g. { name: "Omar" }. */
  params: z.record(z.string(), z.string()),
  /** Plain text for push, email, and WhatsApp, which can't use the app's translations. */
  title: z.string(),
  body: z.string(),
  link: z.string().nullable(),
  channel: notificationChannel,
  read_at: timestamp.nullable(),
});
export type Notification = z.infer<typeof notification>;

/** Reminders (client) and alerts (coach) a person can turn on or off. */
export const prefKey = z.enum(["workout_reminder", "meal_reminder", "checkin_reminder", "request_new", "checkin_new", "workout_done"]);
export type PrefKey = z.infer<typeof prefKey>;

export const notificationPref = base.extend({
  profile_id: id,
  channel: notificationChannel,
  type: prefKey,
  on: z.boolean(),
  /** Daily reminders: when to send, "HH:MM" in his time zone. null for alerts. */
  time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
});
export type NotificationPref = z.infer<typeof notificationPref>;

/** Defaults until he changes them. */
export const defaultPrefs: Record<PrefKey, { on: boolean; time: string | null }> = {
  workout_reminder: { on: true, time: "18:00" },
  meal_reminder: { on: false, time: "13:00" },
  checkin_reminder: { on: true, time: "10:00" },
  request_new: { on: true, time: null },
  checkin_new: { on: true, time: null },
  workout_done: { on: false, time: null },
};

export const auditEntry = z.object({
  id,
  actor_id: id,
  action: z.string(),
  target: z.string(),
  meta: z.record(z.string(), z.unknown()),
  support_mode: z.boolean(),
  created_at: timestamp,
});
export type AuditEntry = z.infer<typeof auditEntry>;

/** "I'm a coach" form on the Coachi home page. The super admin follows up on WhatsApp and adds the coach. */
export const coachLeadStatus = z.enum(["new", "contacted", "added", "dismissed"]);
export type CoachLeadStatus = z.infer<typeof coachLeadStatus>;
export const clientsCount = z.enum(["under_10", "10_30", "over_30"]);

export const coachLead = base.extend({
  name: z.string().min(2).max(80),
  phone,
  city: z.string().max(60).nullable(),
  clients_count: clientsCount,
  message: z.string().max(500).nullable(),
  status: coachLeadStatus,
});
export type CoachLead = z.infer<typeof coachLead>;

export const newCoachLead = coachLead.pick({ name: true, phone: true, city: true, clients_count: true, message: true });
export type NewCoachLead = z.infer<typeof newCoachLead>;

/** Super admin Settings (one row). */
export const appSettings = z.object({
  app_name: z.string().min(1).max(40),
  logo_url: z.string().nullable(),
  support_whatsapp: phone,
});
export type AppSettings = z.infer<typeof appSettings>;

// ---- Designed now, built later ----

export const conversation = orgScoped.extend({
  member_ids: z.array(id).min(2),
});
export type Conversation = z.infer<typeof conversation>;

export const message = base.extend({
  conversation_id: id,
  sender_id: id,
  body: z.string().min(1).max(4000),
  read_at: timestamp.nullable(),
});
export type Message = z.infer<typeof message>;

export const aiUsage = orgScoped.extend({
  feature: z.string(),
  tokens: z.number().int().nonnegative(),
  cost_micros: z.number().int().nonnegative(),
});
export type AiUsage = z.infer<typeof aiUsage>;
