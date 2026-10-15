import type { Food, MacroTotals, MealFull, NutritionPlan, NutritionPlanFull } from "@coachi/validation";

/** Pure helpers for editing a NutritionPlanFull draft. */

const stamp = () => {
  const now = new Date().toISOString();
  return { created_at: now, updated_at: now, deleted_at: null };
};

export function newPlan(orgId: string, coachId: string, name: string, mealName: (n: number) => string): NutritionPlanFull {
  const id = crypto.randomUUID();
  const plan: NutritionPlan = {
    ...stamp(),
    id,
    org_id: orgId,
    coach_id: coachId,
    client_id: null,
    name,
    targets: { kcal: 2000, protein: 150, carbs: 200, fat: 65, water_ml: 2500 },
    day_type: "any",
    notes: null,
    version: 1,
  };
  return { plan, meals: [1, 2, 3].map((n) => newMeal(id, n - 1, mealName(n))) };
}

export function newMeal(planId: string, order: number, name: string): MealFull {
  return { meal: { ...stamp(), id: crypto.randomUUID(), nutrition_plan_id: planId, order, name, note: null }, items: [], log: null };
}

const updateMeal = (p: NutritionPlanFull, mealId: string, fn: (m: MealFull) => MealFull): NutritionPlanFull => ({
  ...p,
  meals: p.meals.map((m) => (m.meal.id === mealId ? fn(m) : m)),
});

export const setMeal = (p: NutritionPlanFull, mealId: string, patch: Partial<Pick<MealFull["meal"], "name" | "note">>) =>
  updateMeal(p, mealId, (m) => ({ ...m, meal: { ...m.meal, ...patch } }));

export function addFood(p: NutritionPlanFull, mealId: string, food: Food, swapWithItemId?: string): NutritionPlanFull {
  return updateMeal(p, mealId, (m) => {
    let items = m.items;
    let group: string | null = null;
    if (swapWithItemId) {
      const anchor = items.find((x) => x.item.id === swapWithItemId);
      const used = new Set(items.map((x) => x.item.swap_group).filter(Boolean));
      group = anchor?.item.swap_group ?? "ABCDEFGH".split("").find((l) => !used.has(l)) ?? "A";
      items = items.map((x) => (x.item.id === swapWithItemId ? { ...x, item: { ...x.item, swap_group: group } } : x));
    }
    const item = { ...stamp(), id: crypto.randomUUID(), meal_id: mealId, food_id: food.id, amount: 1, swap_group: group };
    // Keep "or" choices next to each other.
    const at = swapWithItemId ? items.findLastIndex((x) => x.item.swap_group === group) + 1 : items.length;
    const next = [...items];
    next.splice(at, 0, { item, food });
    return { ...m, items: next };
  });
}

export const setAmount = (p: NutritionPlanFull, mealId: string, itemId: string, amount: number) =>
  updateMeal(p, mealId, (m) => ({ ...m, items: m.items.map((x) => (x.item.id === itemId ? { ...x, item: { ...x.item, amount } } : x)) }));

export function removeFood(p: NutritionPlanFull, mealId: string, itemId: string) {
  return updateMeal(p, mealId, (m) => {
    const group = m.items.find((x) => x.item.id === itemId)?.item.swap_group;
    const items = m.items.filter((x) => x.item.id !== itemId);
    // An "or" with one option left is just a food.
    const left = items.filter((x) => group && x.item.swap_group === group);
    return { ...m, items: left.length === 1 ? items.map((x) => (x === left[0] ? { ...x, item: { ...x.item, swap_group: null } } : x)) : items };
  });
}

export const addMeal = (p: NutritionPlanFull, name: string) => ({ ...p, meals: [...p.meals, newMeal(p.plan.id, p.meals.length, name)] });

export const removeMeal = (p: NutritionPlanFull, mealId: string) => ({
  ...p,
  meals: p.meals.filter((m) => m.meal.id !== mealId).map((m, i) => ({ ...m, meal: { ...m.meal, order: i } })),
});

/** Totals count each "or" group once (its first option), like the client's default choice. */
export function totals(p: NutritionPlanFull): MacroTotals {
  return sumMeals(p.meals);
}

export function mealTotals(m: MealFull): MacroTotals {
  return sumMeals([m]);
}

function sumMeals(meals: MealFull[]): MacroTotals {
  const sum = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const m of meals) {
    const seen = new Set<string>();
    for (const { item, food } of m.items) {
      if (item.swap_group) {
        if (seen.has(item.swap_group)) continue;
        seen.add(item.swap_group);
      }
      sum.kcal += food.kcal * item.amount;
      sum.protein += food.protein * item.amount;
      sum.carbs += food.carbs * item.amount;
      sum.fat += food.fat * item.amount;
    }
  }
  return { kcal: Math.round(sum.kcal), protein: Math.round(sum.protein), carbs: Math.round(sum.carbs), fat: Math.round(sum.fat) };
}

/** A fresh copy with new ids (templates, rest-day versions). */
export function copyPlan(p: NutritionPlanFull, overrides: Partial<Pick<NutritionPlan, "name" | "client_id" | "day_type">>): NutritionPlanFull {
  const id = crypto.randomUUID();
  return {
    plan: { ...p.plan, ...stamp(), id, version: 1, ...overrides },
    meals: p.meals.map((m) => {
      const mealId = crypto.randomUUID();
      return {
        meal: { ...m.meal, ...stamp(), id: mealId, nutrition_plan_id: id },
        items: m.items.map((x) => ({ ...x, item: { ...x.item, ...stamp(), id: crypto.randomUUID(), meal_id: mealId } })),
        log: null,
      };
    }),
  };
}
