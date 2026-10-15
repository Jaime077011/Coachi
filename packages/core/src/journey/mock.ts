import type { ClientToday, JourneySummary } from "@coachi/validation";
import type { JourneyApi } from "./api";
import {
  DEMO,
  bodyMetrics,
  checkinForms,
  checkins,
  clients,
  coachClients,
  coachProfiles,
  exercises,
  journeyMessages,
  mealLogs,
  milestones,
  nutritionPlans,
  programExercises,
  setLogs,
  workoutLogs,
} from "../mock/data";
import { buildPlan } from "../nutrition/mock";
import { dateOnly, mockRead, mockWrite, newId, nowIso } from "../mock/runtime";
import { programDayFor } from "./schedule";

const water = new Map<string, number>(); // `${clientId}:${date}` → glasses

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return dateOnly(d.toISOString());
};

function weekStrip(clientId: string, today: string): ClientToday["week"] {
  // Saturday-first week, as in Egypt.
  const weekday = new Date(`${today}T12:00:00`).getDay();
  const start = addDays(today, -((weekday + 1) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    const day = programDayFor(clientId, date);
    const trained = workoutLogs.some((l) => l.client_id === clientId && l.finished_at && dateOnly(l.started_at) === date);
    const state =
      trained ? "done"
      : date === today ? "today"
      : !day || day.rest_day ? "rest"
      : date < today ? "missed"
      : "upcoming";
    return { date, state };
  });
}

export const mockJourney: JourneyApi = {
  today: (clientId) =>
    mockRead<ClientToday>(
      () => {
        const today = dateOnly(new Date().toISOString());
        const link = coachClients.find((l) => l.client_id === clientId && !l.ended_at);
        const coach = link ? coachProfiles.find((c) => c.id === link.coach_id) : undefined;
        const day = programDayFor(clientId, today);
        const doneToday = workoutLogs.some((l) => l.client_id === clientId && l.finished_at && dateOnly(l.started_at) === today);

        const mealsCard = (() => {
          const planId = findClientPlanId(clientId, day?.rest_day ?? true);
          if (!planId) return null;
          const full = buildPlan(planId, clientId, today);
          const eaten = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
          for (const m of full.meals) {
            if (m.log?.status !== "eaten") continue;
            const firstOfEachSwap = new Set<string>();
            for (const { item, food } of m.items) {
              if (item.swap_group) {
                if (firstOfEachSwap.has(item.swap_group)) continue;
                firstOfEachSwap.add(item.swap_group);
              }
              eaten.kcal += food.kcal * item.amount;
              eaten.protein += food.protein * item.amount;
              eaten.carbs += food.carbs * item.amount;
              eaten.fat += food.fat * item.amount;
            }
          }
          return {
            targets: full.plan.targets,
            eaten: {
              kcal: Math.round(eaten.kcal),
              protein: Math.round(eaten.protein),
              carbs: Math.round(eaten.carbs),
              fat: Math.round(eaten.fat),
            },
            meals: full.meals.map((m) => ({ meal_id: m.meal.id, name: m.meal.name, done: m.log?.status === "eaten" })),
          };
        })();

        const form = coach ? checkinForms.find((f) => f.coach_id === coach.id) : undefined;
        const lastCheckin = checkins.filter((c) => c.client_id === clientId).at(-1);
        const checkinDue =
          !!form &&
          new Date().getDay() === form.day_of_week &&
          (!lastCheckin || Date.now() - Date.parse(lastCheckin.created_at) > 3 * 86_400_000);

        return {
          date: today,
          coach: coach ? { id: coach.id, name: coach.name, logo_url: null, whatsapp: coach.whatsapp } : null,
          week: weekStrip(clientId, today),
          workout: day
            ? {
                day_id: day.id,
                title: day.title,
                exercise_count: programExercises.filter((pe) => pe.program_day_id === day.id).length,
                rest_day: day.rest_day,
                done: doneToday,
              }
            : null,
          meals: mealsCard,
          water_glasses: water.get(`${clientId}:${today}`) ?? 0,
          checkin_due: checkinDue,
          coach_message: journeyMessages.filter((m) => m.client_id === clientId).at(-1)?.text ?? null,
        };
      },
      {
        date: dateOnly(new Date().toISOString()),
        coach: null,
        week: [],
        workout: null,
        meals: null,
        water_glasses: 0,
        checkin_due: false,
        coach_message: null,
      },
    ),

  addWater: (clientId, date, glasses) =>
    mockWrite(() => {
      const key = `${clientId}:${date}`;
      const next = Math.max(0, (water.get(key) ?? 0) + glasses);
      water.set(key, next);
      return next;
    }),

  journey: (clientId) =>
    mockRead<JourneySummary>(() => {
      const client = clients.find((c) => c.id === clientId)!;
      const link = coachClients.find((l) => l.client_id === clientId);
      const coach = link ? coachProfiles.find((c) => c.id === link.coach_id) : undefined;
      const started = link?.started_at ?? client.created_at;
      const myLogs = workoutLogs.filter((l) => l.client_id === clientId && l.finished_at);
      const myLogIds = new Set(myLogs.map((l) => l.id));
      const mySets = setLogs.filter((s) => myLogIds.has(s.workout_log_id) && s.done);
      const metrics = bodyMetrics.filter((m) => m.client_id === clientId).sort((a, b) => a.date.localeCompare(b.date));

      const pbs = new Map<string, { best: number; start: number; at: string }>();
      for (const log of myLogs) {
        for (const s of mySets.filter((s) => s.workout_log_id === log.id)) {
          const w = s.weight_kg ?? 0;
          const current = pbs.get(s.exercise_id);
          if (!current) pbs.set(s.exercise_id, { best: w, start: w, at: log.started_at });
          else if (w > current.best) Object.assign(current, { best: w, at: log.started_at });
        }
      }

      const monthStart = dateOnly(new Date(Date.now() - 30 * 86_400_000).toISOString());
      return {
        day_number: Math.max(1, Math.ceil((Date.now() - Date.parse(started)) / 86_400_000)),
        started_at: started,
        coach_name: coach?.name ?? null,
        streak_weeks: 6,
        start_weight_kg: metrics[0]?.weight_kg ?? null,
        current_weight_kg: metrics.at(-1)?.weight_kg ?? null,
        target_weight_kg: client.target_weight_kg,
        workouts_done: myLogs.length,
        total_kg_lifted: Math.round(mySets.reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0)),
        meals_on_plan_month: mealLogs.filter((l) => l.client_id === clientId && l.status === "eaten" && l.date >= monthStart).length,
        longest_streak_weeks: 6,
        milestones: milestones.filter((m) => m.client_id === clientId).sort((a, b) => a.reached_at.localeCompare(b.reached_at)),
        personal_bests: [...pbs.entries()]
          .map(([exerciseId, pb]) => ({
            exercise: exercises.find((e) => e.id === exerciseId)!,
            best_kg: pb.best,
            start_kg: pb.start,
            reached_at: pb.at,
          }))
          .sort((a, b) => b.best_kg - b.start_kg! - (a.best_kg - a.start_kg!))
          .slice(0, 6),
        coach_messages: journeyMessages.filter((m) => m.client_id === clientId),
        metrics,
      };
    }),

  addBodyMetric: (clientId, input) =>
    mockWrite(() => {
      const metric = { ...input, id: newId(), client_id: clientId, created_at: nowIso(), updated_at: nowIso(), deleted_at: null };
      bodyMetrics.push(metric);
      return metric;
    }),

  addCoachMessage: (clientId, text) =>
    mockWrite(() => {
      const message = {
        id: newId(),
        coach_id: DEMO.coachId,
        client_id: clientId,
        text,
        pinned: true,
        created_at: nowIso(),
        updated_at: nowIso(),
        deleted_at: null,
      };
      journeyMessages.push(message);
      return message;
    }),
};

function findClientPlanId(clientId: string, restDay: boolean) {
  const mine = nutritionPlans.filter((p) => p.client_id === clientId && !p.deleted_at);
  const wanted = restDay ? "rest" : "training";
  return (mine.find((p) => p.day_type === wanted) ?? mine.find((p) => p.day_type === "any") ?? mine[0])?.id ?? null;
}
