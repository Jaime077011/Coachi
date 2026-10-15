import type {
  Exercise,
  Program,
  ProgramFull,
  SetLog,
  WorkoutDay,
  WorkoutLog,
  WorkoutSummary,
} from "@coachi/validation";

export type NewExercise = Pick<Exercise, "name_ar" | "name_en" | "muscle" | "equipment" | "video_url">;
export type SetInput = Pick<SetLog, "id" | "workout_log_id" | "exercise_id" | "set_no" | "weight_kg" | "reps" | "done"> & {
  note?: string | null;
};

export interface TrainingApi {
  exercises(): Promise<Exercise[]>;
  addExercise(input: NewExercise): Promise<Exercise>;
  /** Templates (client_id null) and client programs. */
  programs(coachId: string): Promise<Program[]>;
  getProgram(programId: string): Promise<ProgramFull>;
  /** The client's current program, or null while the coach is still building it. */
  clientProgram(clientId: string): Promise<ProgramFull | null>;
  /** Builders autosave the whole program. */
  saveProgram(full: ProgramFull): Promise<ProgramFull>;
  /** Copies a template to each client. */
  assign(programId: string, clientIds: string[]): Promise<Program[]>;
  workoutDay(clientId: string, dayId: string): Promise<WorkoutDay>;
  /** client_uuid is made on the phone so an offline retry never creates a duplicate. */
  startWorkout(clientId: string, dayId: string, clientUuid: string): Promise<WorkoutLog>;
  /** Saves one set right away; same id = update (safe to retry). */
  logSet(input: SetInput): Promise<SetLog>;
  finishWorkout(workoutLogId: string): Promise<WorkoutSummary>;
}
