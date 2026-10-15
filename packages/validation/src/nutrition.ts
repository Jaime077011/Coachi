import { z } from "zod";
import { base, bilingual, date, id } from "./common";

/** org_id null = shared library (Egyptian foods). Macros per serving. */
export const food = base.extend({
  org_id: id.nullable(),
  ...bilingual,
  serving: z.string().min(1).max(40), // e.g. "100 g", "1 loaf"
  serving_g: z.number().positive().nullable(),
  kcal: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
});
export type Food = z.infer<typeof food>;

export const macroTargets = z.object({
  kcal: z.number().int().nonnegative(),
  protein: z.number().int().nonnegative(),
  carbs: z.number().int().nonnegative(),
  fat: z.number().int().nonnegative(),
  water_ml: z.number().int().nonnegative(),
});
export type MacroTargets = z.infer<typeof macroTargets>;

export const dayType = z.enum(["training", "rest", "any"]);

/** client_id null = template. */
export const nutritionPlan = base.extend({
  org_id: id,
  coach_id: id,
  client_id: id.nullable(),
  name: z.string().min(1).max(80),
  targets: macroTargets,
  day_type: dayType,
  notes: z.string().max(1000).nullable(),
  version: z.number().int().positive(),
});
export type NutritionPlan = z.infer<typeof nutritionPlan>;

export const meal = base.extend({
  nutrition_plan_id: id,
  order: z.number().int().nonnegative(),
  name: z.string().min(1).max(40),
  note: z.string().max(300).nullable(),
});
export type Meal = z.infer<typeof meal>;

/** Items with the same swap_group are "or" choices. */
export const mealItem = base.extend({
  meal_id: id,
  food_id: id,
  amount: z.number().positive(), // in servings
  swap_group: z.string().max(4).nullable(),
});
export type MealItem = z.infer<typeof mealItem>;

export const mealLogStatus = z.enum(["eaten", "ate_other", "skipped"]);

export const mealLog = base.extend({
  client_id: id,
  meal_id: id,
  date,
  status: mealLogStatus,
  note: z.string().max(300).nullable(),
});
export type MealLog = z.infer<typeof mealLog>;
