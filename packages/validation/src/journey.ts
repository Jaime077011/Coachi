import { z } from "zod";
import { base, date, id, timestamp } from "./common";

export const milestoneType = z.enum([
  "first_workout",
  "workouts_count", // value: 10 / 25 / 50 / 100
  "first_pb",
  "weight_change", // value: every 2 kg lost or gained
  "streak_weeks", // value: 4
  "new_plan",
]);
export type MilestoneType = z.infer<typeof milestoneType>;

/** Made by background jobs. */
export const milestone = base.extend({
  client_id: id,
  type: milestoneType,
  value: z.number().nullable(),
  reached_at: timestamp,
});
export type Milestone = z.infer<typeof milestone>;

export const journeyMessage = base.extend({
  coach_id: id,
  client_id: id,
  text: z.string().min(1).max(300),
  pinned: z.boolean(),
});
export type JourneyMessage = z.infer<typeof journeyMessage>;

/** Summary table kept fresh by jobs, so dashboards don't scan every set. */
export const dailyClientStats = base.extend({
  client_id: id,
  date,
  workouts: z.number().int().nonnegative(),
  volume_kg: z.number().nonnegative(),
  meals_on_plan: z.number().int().nonnegative(),
  streak: z.number().int().nonnegative(),
});
export type DailyClientStats = z.infer<typeof dailyClientStats>;
