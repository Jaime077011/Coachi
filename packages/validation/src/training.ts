import { z } from "zod";
import { base, bilingual, date, id, timestamp, url, weightKg } from "./common";
import { gymItem } from "./gym";

export const muscleGroup = z.enum([
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "core",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "full_body",
  "cardio",
]);
export type MuscleGroup = z.infer<typeof muscleGroup>;

export const equipment = z.enum([
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "kettlebell",
  "bodyweight",
  "band",
  "smith",
  "other",
]);

/** org_id null = shared library. */
export const exercise = base.extend({
  org_id: id.nullable(),
  ...bilingual,
  muscle: muscleGroup,
  equipment,
  /** Everything the exercise needs; all of it must be in the gym. Empty = no equipment. */
  gym_items: z.array(gymItem),
  video_url: url.nullable(),
  image_url: url.nullable(),
});
export type Exercise = z.infer<typeof exercise>;

/** client_id null = template. */
export const program = base.extend({
  org_id: id,
  coach_id: id,
  client_id: id.nullable(),
  name: z.string().min(1).max(80),
  weeks: z.number().int().min(1).max(52),
  starts_on: date.nullable(),
  version: z.number().int().positive(),
});
export type Program = z.infer<typeof program>;

export const programDay = base.extend({
  program_id: id,
  week: z.number().int().min(1),
  day: z.number().int().min(1).max(7),
  title: z.string().max(60),
  rest_day: z.boolean(),
});
export type ProgramDay = z.infer<typeof programDay>;

/** Reps as text so ranges ("8-12") and time ("45s") both fit. */
export const programExercise = base.extend({
  program_day_id: id,
  exercise_id: id,
  order: z.number().int().nonnegative(),
  sets: z.number().int().min(1).max(20),
  reps: z.string().min(1).max(20),
  rest_sec: z.number().int().min(0).max(600),
  target: z.string().max(20).nullable(), // weight or RPE, e.g. "60 kg" or "RPE 8"
  tempo: z.string().max(12).nullable(),
  note: z.string().max(300).nullable(),
  group: z.string().max(4).nullable(), // same letter = superset / circuit
});
export type ProgramExercise = z.infer<typeof programExercise>;

/** client_uuid is made on the phone so offline logs sync safely, without duplicates. */
export const workoutLog = base.extend({
  client_id: id,
  program_day_id: id.nullable(),
  started_at: timestamp,
  finished_at: timestamp.nullable(),
  note: z.string().max(500).nullable(),
  client_uuid: id,
});
export type WorkoutLog = z.infer<typeof workoutLog>;

/** One row per set. Saved the moment it is entered. */
export const setLog = base.extend({
  workout_log_id: id,
  exercise_id: id,
  set_no: z.number().int().min(1),
  weight_kg: weightKg.nullable(),
  reps: z.number().int().min(0).max(200).nullable(),
  rpe: z.number().min(1).max(10).nullable(),
  done: z.boolean(),
  note: z.string().max(300).nullable(),
});
export type SetLog = z.infer<typeof setLog>;

/** A day as the client sees it in workout mode, with last time's numbers. */
export const workoutDay = z.object({
  day: programDay,
  exercises: z.array(
    z.object({
      item: programExercise,
      exercise,
      last_sets: z.array(setLog.pick({ set_no: true, weight_kg: true, reps: true })),
    }),
  ),
});
export type WorkoutDay = z.infer<typeof workoutDay>;
