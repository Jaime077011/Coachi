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

export const notification = base.extend({
  profile_id: id,
  type: z.string(),
  title: z.string(),
  body: z.string(),
  link: z.string().nullable(),
  channel: notificationChannel,
  read_at: timestamp.nullable(),
});
export type Notification = z.infer<typeof notification>;

export const notificationPref = base.extend({
  profile_id: id,
  channel: notificationChannel,
  type: z.string(),
  on: z.boolean(),
});
export type NotificationPref = z.infer<typeof notificationPref>;

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
