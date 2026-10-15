import type { NutritionPlanFull } from "@coachi/validation";
import type { NutritionApi } from "./api";
import { DEMO, foods, mealItems, mealLogs, meals, nutritionPlans } from "../mock/data";
import { ApiError, mockRead, mockWrite, newId, nowIso } from "../mock/runtime";
import { requireActiveSubscription, requireMember } from "../mock/session";
import { isTrainingDay } from "../journey/schedule";

const stamp = () => ({ created_at: nowIso(), updated_at: nowIso(), deleted_at: null });

function remove<T>(list: T[], predicate: (item: T) => boolean) {
  for (let i = list.length - 1; i >= 0; i--) if (predicate(list[i]!)) list.splice(i, 1);
}

export function buildPlan(planId: string, clientId?: string, date?: string): NutritionPlanFull {
  const plan = nutritionPlans.find((p) => p.id === planId);
  if (!plan) throw new ApiError("not_found");
  return {
    plan,
    meals: meals
      .filter((m) => m.nutrition_plan_id === planId)
      .sort((a, b) => a.order - b.order)
      .map((meal) => ({
        meal,
        items: mealItems
          .filter((i) => i.meal_id === meal.id)
          .map((item) => ({ item, food: foods.find((f) => f.id === item.food_id)! })),
        log:
          clientId && date
            ? (mealLogs.find((l) => l.client_id === clientId && l.meal_id === meal.id && l.date === date) ?? null)
            : null,
      })),
  };
}

function replacePlan(full: NutritionPlanFull) {
  const mealIds = new Set(meals.filter((m) => m.nutrition_plan_id === full.plan.id).map((m) => m.id));
  remove(meals, (m) => m.nutrition_plan_id === full.plan.id);
  remove(mealItems, (i) => mealIds.has(i.meal_id));
  const index = nutritionPlans.findIndex((p) => p.id === full.plan.id);
  if (index >= 0) nutritionPlans[index] = full.plan;
  else nutritionPlans.push(full.plan);
  for (const { meal, items } of full.meals) {
    meals.push(meal);
    mealItems.push(...items.map(({ item }) => item));
  }
}

export const mockNutrition: NutritionApi = {
  foods: () => mockRead(() => foods.filter((f) => !f.deleted_at), []),

  addFood: (input) =>
    mockWrite(() => {
      requireMember("library_add");
      const food = { ...input, ...stamp(), id: newId(), org_id: DEMO.orgId };
      foods.push(food);
      return food;
    }),

  plans: (coachId) => mockRead(() => nutritionPlans.filter((p) => p.coach_id === coachId && !p.deleted_at), []),

  getPlan: (planId) => mockRead(() => buildPlan(planId)),

  savePlan: (full) =>
    mockWrite(() => {
      requireMember("plans_edit");
      if (!nutritionPlans.some((p) => p.id === full.plan.id)) requireActiveSubscription();
      replacePlan({ ...full, plan: { ...full.plan, updated_at: nowIso() } });
      return buildPlan(full.plan.id);
    }),

  assign: (planId, clientIds) =>
    mockWrite(() => {
      requireMember("plans_edit");
      requireActiveSubscription();
      return clientIds.map((clientId) => {
        const source = buildPlan(planId);
        const id = newId();
        const copy: NutritionPlanFull = {
          plan: { ...source.plan, ...stamp(), id, client_id: clientId, version: 1 },
          meals: source.meals.map(({ meal, items }) => {
            const mealId = newId();
            return {
              meal: { ...meal, ...stamp(), id: mealId, nutrition_plan_id: id },
              items: items.map(({ item, food }) => ({ item: { ...item, ...stamp(), id: newId(), meal_id: mealId }, food })),
              log: null,
            };
          }),
        };
        replacePlan(copy);
        return copy.plan;
      });
    }),

  clientDay: (clientId, date) =>
    mockRead(() => {
      const mine = nutritionPlans.filter((p) => p.client_id === clientId && !p.deleted_at);
      const wanted = isTrainingDay(clientId, date) ? "training" : "rest";
      const plan = mine.find((p) => p.day_type === wanted) ?? mine.find((p) => p.day_type === "any") ?? mine[0];
      return plan ? buildPlan(plan.id, clientId, date) : null;
    }, null),

  logMeal: (clientId, input) =>
    mockWrite(() => {
      const existing = mealLogs.find((l) => l.client_id === clientId && l.meal_id === input.meal_id && l.date === input.date);
      if (existing) {
        Object.assign(existing, input, { updated_at: nowIso() });
        return existing;
      }
      const log = { ...input, ...stamp(), id: newId(), client_id: clientId };
      mealLogs.push(log);
      return log;
    }),
};
