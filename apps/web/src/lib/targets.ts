import type { ClientDetails, Goal, MacroTargets } from "@coachi/validation";

const activityFactor = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 } as const;
const goalAdjust: Record<Goal, number> = { fat_loss: -0.2, muscle: 0.1, strength: 0.05, health: 0 };

/**
 * A starting point the coach can change: Mifflin-St Jeor BMR × activity, adjusted for the goal.
 * Protein 2 g/kg (2.2 when cutting), fat 25% of calories, carbs the rest. Rounded to friendly numbers.
 */
export function suggestTargets(d: ClientDetails | null, goal: Goal | null): MacroTargets | null {
  if (!d?.start_weight_kg || !d.height_cm || !d.age) return null;
  const w = d.start_weight_kg;
  const bmr = 10 * w + 6.25 * d.height_cm - 5 * d.age + (d.gender === "female" ? -161 : 5);
  const tdee = bmr * activityFactor[d.activity ?? "light"];
  const kcal = Math.round((tdee * (1 + goalAdjust[goal ?? "health"])) / 50) * 50;
  const protein = Math.round(w * (goal === "fat_loss" ? 2.2 : 2));
  const fat = Math.round((kcal * 0.25) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const water = Math.round((w * 35) / 250) * 250;
  return { kcal, protein, carbs, fat, water_ml: water };
}
