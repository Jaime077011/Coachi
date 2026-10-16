import { z } from "zod";
import { orgRole } from "./auth-orgs";
import {
  base,
  date,
  gender,
  goal,
  id,
  lengthCm,
  orgScoped,
  phone,
  timestamp,
  url,
  weightKg,
} from "./common";
import { clientGym } from "./gym";

export const clientStatus = z.enum(["invited", "active", "paused", "archived"]);
export type ClientStatus = z.infer<typeof clientStatus>;

/** The client himself. A client can exist with no coach (browsing the directory). */
export const client = base.extend({
  profile_id: id,
  status: clientStatus,
  goal: goal.nullable(),
  target_weight_kg: weightKg.nullable(),
  target_date: date.nullable(),
});
export type Client = z.infer<typeof client>;

/** Coach and client linked by their own table: history, switching, more than one coach later. */
export const coachClient = orgScoped.extend({
  coach_id: id,
  client_id: id,
  role: z.enum(["trainer", "nutrition"]),
  status: z.enum(["active", "paused", "ended"]),
  started_at: timestamp,
  ended_at: timestamp.nullable(),
  /** The team member working with this client (org_members.id). null = owner and head coaches only. */
  assigned_member_id: id.nullable(),
});
export type CoachClient = z.infer<typeof coachClient>;

export const activityLevel = z.enum(["sedentary", "light", "moderate", "active", "very_active"]);
export const trainingPlace = z.enum(["gym", "home", "both"]);
export const budgetLevel = z.enum(["low", "medium", "high"]);

/** The client file: filled by the client's intake form, reviewed by the coach. */
export const clientDetails = base.extend({
  client_id: id,
  // Profile
  age: z.number().int().min(10).max(100).nullable(),
  gender: gender.nullable(),
  height_cm: lengthCm.nullable(),
  start_weight_kg: weightKg.nullable(),
  job: z.string().max(80).nullable(),
  activity: activityLevel.nullable(),
  training_days: z.array(z.number().int().min(0).max(6)),
  training_time: z.string().nullable(),
  place: trainingPlace.nullable(),
  equipment: z.array(z.string()),
  // Health and history
  injuries: z.string().max(1000).nullable(),
  pain_areas: z.array(z.string()),
  health_notes: z.string().max(1000).nullable(),
  medicines: z.string().max(500).nullable(),
  past_training: z.string().max(500).nullable(),
  sports: z.string().max(200).nullable(),
  // Food
  food_likes: z.string().max(500).nullable(),
  food_dislikes: z.string().max(500).nullable(),
  food_never: z.string().max(500).nullable(),
  meals_per_day: z.number().int().min(1).max(8).nullable(),
  budget: budgetLevel.nullable(),
  cooks_at_home: z.boolean().nullable(),
  water_liters: z.number().min(0).max(10).nullable(),
  supplements: z.string().max(300).nullable(),
  intake_completed_at: timestamp.nullable(),
});
export type ClientDetails = z.infer<typeof clientDetails>;

export const noteTag = z.enum(["injury", "mindset", "food", "family", "work"]);
export type NoteTag = z.infer<typeof noteTag>;

/** Private to the coach. The client never sees these. */
export const coachNote = base.extend({
  coach_id: id,
  client_id: id,
  /** The person who wrote it (profiles.id): the owner or a team member. */
  author_id: id.nullable(),
  text: z.string().min(1).max(4000),
  tags: z.array(noteTag),
  pinned: z.boolean(),
});
export type CoachNote = z.infer<typeof coachNote>;

/** A note as the client file shows it: with the writer's name, since team members write notes too. */
export const coachNoteView = coachNote.extend({ author_name: z.string().nullable() });
export type CoachNoteView = z.infer<typeof coachNoteView>;

export const newCoachNote = coachNote.pick({ client_id: true, text: true, tags: true, pinned: true });
export type NewCoachNote = z.infer<typeof newCoachNote>;

/** One table for both invite links: a client joining the coach, or a helper joining his team. */
export const invite = orgScoped.extend({
  coach_id: id,
  kind: z.enum(["client", "team"]),
  /** Team invites only. */
  member_role: orgRole.nullable(),
  code: z.string().min(6).max(32),
  name: z.string(),
  phone,
  expires_at: timestamp,
  used_by: id.nullable(),
});
export type Invite = z.infer<typeof invite>;

/** "Add client": name and phone only. */
export const newClient = z.object({
  name: z.string().min(2).max(80),
  phone,
});
export type NewClient = z.infer<typeof newClient>;

/** A row in the coach's client list. */
export const clientSummary = z.object({
  id,
  name: z.string(),
  avatar_url: url.nullable(),
  goal: goal.nullable(),
  status: clientStatus,
  plan_name: z.string().nullable(),
  last_workout_at: timestamp.nullable(),
  adherence_done: z.number().int().nonnegative(),
  adherence_planned: z.number().int().nonnegative(),
  needs_attention: z.boolean(),
  /** Team member working with this client, if any. */
  assigned_to: z.object({ member_id: id, name: z.string() }).nullable(),
});
export type ClientSummary = z.infer<typeof clientSummary>;

/** The coach's full view of one client. */
export const clientFile = z.object({
  client,
  profile: z.object({
    name: z.string(),
    phone: phone.nullable(),
    avatar_url: url.nullable(),
  }),
  details: clientDetails.nullable(),
  notes: z.array(coachNoteView),
  /** What his gym has. null = he hasn't listed it yet. */
  gym: clientGym.nullable(),
  started_at: timestamp,
  assigned_member_id: id.nullable(),
});
export type ClientFile = z.infer<typeof clientFile>;
