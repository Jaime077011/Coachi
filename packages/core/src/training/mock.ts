import type { ProgramFull } from "@coachi/validation";
import type { TrainingApi } from "./api";
import { DEMO, exercises, programDays, programExercises, programs, setLogs, workoutLogs } from "../mock/data";
import { ApiError, mockRead, mockWrite, newId, nowIso } from "../mock/runtime";
import { requireActiveSubscription, requireMember } from "../mock/session";

const stamp = () => ({ created_at: nowIso(), updated_at: nowIso(), deleted_at: null });

export function buildProgram(programId: string): ProgramFull {
  const program = programs.find((p) => p.id === programId);
  if (!program) throw new ApiError("not_found");
  return {
    program,
    days: programDays
      .filter((d) => d.program_id === programId)
      .sort((a, b) => a.week - b.week || a.day - b.day)
      .map((day) => ({
        day,
        items: programExercises
          .filter((pe) => pe.program_day_id === day.id)
          .sort((a, b) => a.order - b.order)
          .map((item) => ({ item, exercise: exercises.find((e) => e.id === item.exercise_id)! })),
      })),
  };
}

function replaceProgram(full: ProgramFull) {
  const dayIds = new Set(programDays.filter((d) => d.program_id === full.program.id).map((d) => d.id));
  remove(programDays, (d) => d.program_id === full.program.id);
  remove(programExercises, (pe) => dayIds.has(pe.program_day_id));
  const index = programs.findIndex((p) => p.id === full.program.id);
  if (index >= 0) programs[index] = full.program;
  else programs.push(full.program);
  for (const { day, items } of full.days) {
    programDays.push(day);
    programExercises.push(...items.map(({ item }) => item));
  }
}

function remove<T>(list: T[], predicate: (item: T) => boolean) {
  for (let i = list.length - 1; i >= 0; i--) if (predicate(list[i]!)) list.splice(i, 1);
}

/** Copy with fresh ids, for templates → client plans. */
function copyProgram(full: ProgramFull, clientId: string | null): ProgramFull {
  const programId = newId();
  return {
    program: { ...full.program, ...stamp(), id: programId, client_id: clientId, version: 1 },
    days: full.days.map(({ day, items }) => {
      const dayId = newId();
      return {
        day: { ...day, ...stamp(), id: dayId, program_id: programId },
        items: items.map(({ item, exercise }) => ({
          item: { ...item, ...stamp(), id: newId(), program_day_id: dayId },
          exercise,
        })),
      };
    }),
  };
}

export const mockTraining: TrainingApi = {
  exercises: () => mockRead(() => exercises.filter((e) => !e.deleted_at), []),

  addExercise: (input) =>
    mockWrite(() => {
      requireMember("library_add");
      const exercise = { ...input, ...stamp(), id: newId(), org_id: DEMO.orgId, image_url: null };
      exercises.push(exercise);
      return exercise;
    }),

  programs: (coachId) => mockRead(() => programs.filter((p) => p.coach_id === coachId && !p.deleted_at), []),

  getProgram: (programId) => mockRead(() => buildProgram(programId)),

  clientProgram: (clientId) =>
    mockRead(() => {
      const program = programs.find((p) => p.client_id === clientId && !p.deleted_at);
      return program ? buildProgram(program.id) : null;
    }, null),

  saveProgram: (full) =>
    mockWrite(() => {
      requireMember("plans_edit");
      if (!programs.some((p) => p.id === full.program.id)) requireActiveSubscription();
      replaceProgram({ ...full, program: { ...full.program, updated_at: nowIso() } });
      return buildProgram(full.program.id);
    }),

  assign: (programId, clientIds) =>
    mockWrite(() => {
      requireMember("plans_edit");
      requireActiveSubscription();
      return clientIds.map((clientId) => {
        // A client has one current program: end the old one by soft-deleting it.
        for (const p of programs) if (p.client_id === clientId && !p.deleted_at) p.deleted_at = nowIso();
        const copy = copyProgram(buildProgram(programId), clientId);
        copy.program.starts_on = nowIso().slice(0, 10);
        replaceProgram(copy);
        return copy.program;
      });
    }),

  workoutDay: (clientId, dayId) =>
    mockRead(() => {
      const day = programDays.find((d) => d.id === dayId);
      if (!day) throw new ApiError("not_found");
      const items = programExercises.filter((pe) => pe.program_day_id === dayId).sort((a, b) => a.order - b.order);
      const myLogs = workoutLogs.filter((l) => l.client_id === clientId && l.finished_at);
      return {
        day,
        exercises: items.map((item) => {
          const lastLog = [...myLogs]
            .reverse()
            .find((l) => setLogs.some((s) => s.workout_log_id === l.id && s.exercise_id === item.exercise_id));
          return {
            item,
            exercise: exercises.find((e) => e.id === item.exercise_id)!,
            last_sets: lastLog
              ? setLogs
                  .filter((s) => s.workout_log_id === lastLog.id && s.exercise_id === item.exercise_id)
                  .map(({ set_no, weight_kg, reps }) => ({ set_no, weight_kg, reps }))
              : [],
          };
        }),
      };
    }),

  startWorkout: (clientId, dayId, clientUuid) =>
    mockWrite(() => {
      const existing = workoutLogs.find((l) => l.client_uuid === clientUuid);
      if (existing) return existing;
      const log = {
        id: newId(),
        client_id: clientId,
        program_day_id: dayId,
        started_at: nowIso(),
        finished_at: null,
        note: null,
        client_uuid: clientUuid,
        ...stamp(),
      };
      workoutLogs.push(log);
      return log;
    }),

  logSet: (input) =>
    mockWrite(() => {
      const existing = setLogs.find((s) => s.id === input.id);
      if (existing) {
        Object.assign(existing, input, { updated_at: nowIso() });
        return existing;
      }
      const set = { rpe: null, note: null, ...input, ...stamp() };
      setLogs.push(set);
      return set;
    }),

  finishWorkout: (workoutLogId) =>
    mockWrite(() => {
      const log = workoutLogs.find((l) => l.id === workoutLogId);
      if (!log) throw new ApiError("not_found");
      log.finished_at = nowIso();
      const sets = setLogs.filter((s) => s.workout_log_id === workoutLogId && s.done);
      const earlierLogIds = new Set(
        workoutLogs.filter((l) => l.client_id === log.client_id && l.id !== log.id).map((l) => l.id),
      );
      const bests = new Map<string, number>();
      for (const s of sets) bests.set(s.exercise_id, Math.max(bests.get(s.exercise_id) ?? 0, s.weight_kg ?? 0));
      const personal_bests = [...bests.entries()].flatMap(([exerciseId, weight]) => {
        const previous = setLogs
          .filter((s) => earlierLogIds.has(s.workout_log_id) && s.exercise_id === exerciseId)
          .reduce((max, s) => Math.max(max, s.weight_kg ?? 0), 0);
        return weight > previous && weight > 0
          ? [{ exercise: exercises.find((e) => e.id === exerciseId)!, weight_kg: weight, previous_kg: previous || null }]
          : [];
      });
      return {
        workout_log_id: log.id,
        duration_sec: Math.round((Date.parse(log.finished_at) - Date.parse(log.started_at)) / 1000),
        volume_kg: sets.reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0),
        sets_done: sets.length,
        personal_bests,
        first_workout: earlierLogIds.size === 0,
      };
    }),
};
