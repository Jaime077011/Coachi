import { z } from "zod";
import { coachProfile, coachRequest, coachResult } from "./directory";
import { date, id, timestamp, url, weightKg } from "./common";
import { plan, planFeature, subscription, subscriptionStatus } from "./billing";
import { exercise, program, programDay, programExercise } from "./training";
import { food, macroTargets, meal, mealItem, mealLog, nutritionPlan } from "./nutrition";
import { bodyMetric, checkin } from "./progress-checkins";
import { journeyMessage, milestone } from "./journey";

/**
 * Composite shapes the screens read. Each one is assembled from the table shapes, so the
 * Supabase version can build them with a view or an RPC and the screens don't change.
 */

// ---------------------------------------------------------------- shared

export const weekDayState = z.enum(["done", "missed", "today", "upcoming", "rest"]);
export const weekStripDay = z.object({ date, state: weekDayState });
export type WeekStripDay = z.infer<typeof weekStripDay>;

export const macroTotals = macroTargets.omit({ water_ml: true });
export type MacroTotals = z.infer<typeof macroTotals>;

// ---------------------------------------------------------------- training

export const programFull = z.object({
  program,
  days: z.array(
    z.object({
      day: programDay,
      items: z.array(z.object({ item: programExercise, exercise })),
    }),
  ),
});
export type ProgramFull = z.infer<typeof programFull>;

export const workoutSummary = z.object({
  workout_log_id: id,
  duration_sec: z.number().int().nonnegative(),
  volume_kg: z.number().nonnegative(),
  sets_done: z.number().int().nonnegative(),
  personal_bests: z.array(z.object({ exercise, weight_kg: weightKg, previous_kg: weightKg.nullable() })),
  first_workout: z.boolean(),
});
export type WorkoutSummary = z.infer<typeof workoutSummary>;

// ---------------------------------------------------------------- nutrition

export const mealFull = z.object({
  meal,
  items: z.array(z.object({ item: mealItem, food })),
  log: mealLog.nullable(),
});
export type MealFull = z.infer<typeof mealFull>;

export const nutritionPlanFull = z.object({
  plan: nutritionPlan,
  meals: z.array(mealFull),
});
export type NutritionPlanFull = z.infer<typeof nutritionPlanFull>;

// ---------------------------------------------------------------- client home

export const clientToday = z.object({
  date,
  coach: z
    .object({ id, name: z.string(), logo_url: url.nullable(), whatsapp: z.string().nullable() })
    .nullable(),
  week: z.array(weekStripDay),
  workout: z
    .object({
      day_id: id,
      title: z.string(),
      exercise_count: z.number().int(),
      rest_day: z.boolean(),
      done: z.boolean(),
    })
    .nullable(),
  meals: z.object({
    targets: macroTargets,
    eaten: macroTotals,
    meals: z.array(z.object({ meal_id: id, name: z.string(), done: z.boolean() })),
  }).nullable(),
  water_glasses: z.number().int().nonnegative(),
  checkin_due: z.boolean(),
  coach_message: z.string().nullable(),
});
export type ClientToday = z.infer<typeof clientToday>;

export const journeySummary = z.object({
  day_number: z.number().int().positive(),
  started_at: timestamp,
  coach_name: z.string().nullable(),
  streak_weeks: z.number().int().nonnegative(),
  start_weight_kg: weightKg.nullable(),
  current_weight_kg: weightKg.nullable(),
  target_weight_kg: weightKg.nullable(),
  workouts_done: z.number().int().nonnegative(),
  total_kg_lifted: z.number().nonnegative(),
  meals_on_plan_month: z.number().int().nonnegative(),
  longest_streak_weeks: z.number().int().nonnegative(),
  milestones: z.array(milestone),
  personal_bests: z.array(
    z.object({ exercise, best_kg: weightKg, start_kg: weightKg.nullable(), reached_at: timestamp }),
  ),
  coach_messages: z.array(journeyMessage),
  metrics: z.array(bodyMetric),
});
export type JourneySummary = z.infer<typeof journeySummary>;

// ---------------------------------------------------------------- coach home

export const attentionReason = z.enum([
  "missed_workouts",
  "plan_ending",
  "unread_checkin",
  "request_waiting",
]);

export const coachToday = z.object({
  needs_attention: z.array(
    z.object({
      reason: attentionReason,
      client_id: id.nullable(),
      request_id: id.nullable(),
      name: z.string(),
      detail: z.number().int().nullable(), // missed count, days left, hours waiting
    }),
  ),
  activity: z.array(
    z.object({
      client_id: id,
      name: z.string(),
      kind: z.enum(["workout", "meals", "checkin"]),
      title: z.string(),
      at: timestamp,
    }),
  ),
  new_requests: z.number().int().nonnegative(),
});
export type CoachToday = z.infer<typeof coachToday>;

export const clientProgress = z.object({
  metrics: z.array(bodyMetric),
  lifts: z.array(
    z.object({ exercise, points: z.array(z.object({ date, weight_kg: weightKg })) }),
  ),
  checkins: z.array(checkin),
});
export type ClientProgress = z.infer<typeof clientProgress>;

// ---------------------------------------------------------------- directory

export const coachPage = z.object({
  profile: coachProfile,
  results: z.array(coachResult),
  my_request: coachRequest.nullable(),
});
export type CoachPage = z.infer<typeof coachPage>;


// ---------------------------------------------------------------- billing + admin

export const planWithFeatures = z.object({
  plan,
  features: z.array(planFeature),
  coaches_on_plan: z.number().int().nonnegative(),
});
export type PlanWithFeatures = z.infer<typeof planWithFeatures>;

export const coachSubscriptionView = z.object({
  subscription,
  plan,
  client_limit: z.number().int().nullable(),
  client_count: z.number().int().nonnegative(),
  days_left: z.number().int(),
});
export type CoachSubscriptionView = z.infer<typeof coachSubscriptionView>;

export const adminCoachRow = z.object({
  coach_id: id,
  org_id: id,
  name: z.string(),
  phone: z.string().nullable(),
  plan_name: z.string(),
  client_count: z.number().int().nonnegative(),
  status: subscriptionStatus,
  ends_at: timestamp,
  last_active_at: timestamp.nullable(),
  listed: z.boolean(),
});
export type AdminCoachRow = z.infer<typeof adminCoachRow>;

export const adminOverview = z.object({
  active_coaches: z.number().int().nonnegative(),
  total_clients: z.number().int().nonnegative(),
  workouts_this_week: z.number().int().nonnegative(),
  ending_in_7_days: z.number().int().nonnegative(),
  ending_soon: z.array(adminCoachRow),
  newest: z.array(adminCoachRow),
});
export type AdminOverview = z.infer<typeof adminOverview>;

export const directoryQueueItem = z.object({
  profile: coachProfile,
  requests_total: z.number().int().nonnegative(),
  requests_accepted: z.number().int().nonnegative(),
});
export type DirectoryQueueItem = z.infer<typeof directoryQueueItem>;

