import { z } from "zod";
import { base, date, dayOfWeek, id, lengthCm, orgScoped, storagePath, timestamp, weightKg } from "./common";

export const bodyMetric = base.extend({
  client_id: id,
  date,
  weight_kg: weightKg.nullable(),
  waist_cm: lengthCm.nullable(),
  /** Private bucket; opened only with short-lived signed links. */
  photo_paths: z.array(storagePath),
});
export type BodyMetric = z.infer<typeof bodyMetric>;

export const checkinQuestion = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(200),
  kind: z.enum(["text", "scale", "yes_no"]),
});
export type CheckinQuestion = z.infer<typeof checkinQuestion>;

export const checkinForm = orgScoped.extend({
  coach_id: id,
  questions: z.array(checkinQuestion).min(1).max(15),
  day_of_week: dayOfWeek,
});
export type CheckinForm = z.infer<typeof checkinForm>;

export const checkinAnswer = z.object({
  question_id: z.string(),
  value: z.union([z.string().max(1000), z.number(), z.boolean()]),
});

export const checkin = base.extend({
  client_id: id,
  form_id: id,
  answers: z.array(checkinAnswer),
  weight_kg: weightKg.nullable(),
  photo_paths: z.array(storagePath).max(3),
  note: z.string().max(1000).nullable(),
  coach_reply: z.string().max(2000).nullable(),
  read_at: timestamp.nullable(),
});
export type Checkin = z.infer<typeof checkin>;
