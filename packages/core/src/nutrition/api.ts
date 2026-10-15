import type { Food, MealLog, NutritionPlan, NutritionPlanFull } from "@coachi/validation";

export type NewFood = Pick<Food, "name_ar" | "name_en" | "serving" | "serving_g" | "kcal" | "protein" | "carbs" | "fat">;
export type MealLogInput = Pick<MealLog, "meal_id" | "date" | "status" | "note">;

export interface NutritionApi {
  foods(): Promise<Food[]>;
  addFood(input: NewFood): Promise<Food>;
  /** Templates (client_id null) and client plans. */
  plans(coachId: string): Promise<NutritionPlan[]>;
  getPlan(planId: string): Promise<NutritionPlanFull>;
  savePlan(full: NutritionPlanFull): Promise<NutritionPlanFull>;
  assign(planId: string, clientIds: string[]): Promise<NutritionPlan[]>;
  /** The right plan for that date (training or rest day switch on their own), with ticks. */
  clientDay(clientId: string, date: string): Promise<NutritionPlanFull | null>;
  logMeal(clientId: string, input: MealLogInput): Promise<MealLog>;
}
