import type {
  BodyMetric,
  Checkin,
  Client,
  ClientDetails,
  ClientFile,
  ClientGym,
  ClientProgress,
  ClientStatus,
  ClientSummary,
  CoachNote,
  CoachToday,
  GymInput,
  MealLog,
  Milestone,
  NewClient,
  NewCoachNote,
  Profile,
  SetLog,
  WorkoutLog,
} from "@coachi/validation";

/** "Download my data": everything kept about the client. Never the coach's private notes. */
export type MyDataExport = {
  exported_at: string;
  profile: Profile;
  client: Client;
  details: ClientDetails | null;
  gym: ClientGym | null;
  workouts: { log: WorkoutLog; sets: SetLog[] }[];
  meal_logs: MealLog[];
  body_metrics: BodyMetric[];
  checkins: Checkin[];
  milestones: Milestone[];
};

/** Coach export: one row per client he may see, ready to become a spreadsheet. */
export type ClientExportRow = {
  name: string;
  phone: string | null;
  status: Client["status"];
  goal: Client["goal"];
  started_at: string | null;
  assigned_to: string | null;
  age: number | null;
  gender: ClientDetails["gender"];
  height_cm: number | null;
  start_weight_kg: number | null;
  latest_weight_kg: number | null;
  target_weight_kg: number | null;
  training_days: number[];
  place: ClientDetails["place"];
  gym_name: string | null;
  gym_items: string[];
  injuries: string | null;
  health_notes: string | null;
  medicines: string | null;
  food_likes: string | null;
  food_dislikes: string | null;
  food_never: string | null;
  meals_per_day: number | null;
  workouts_done: number;
  last_workout_at: string | null;
  notes: string[];
};

export interface ClientsApi {
  list(coachId: string): Promise<ClientSummary[]>;
  get(clientId: string): Promise<ClientFile>;
  /** Makes an invite link to send on WhatsApp. Fails with limit_reached at the plan's client limit. */
  invite(input: NewClient): Promise<{ inviteUrl: string; code: string }>;
  setStatus(clientId: string, status: ClientStatus): Promise<void>;
  updateDetails(clientId: string, patch: Partial<ClientDetails>): Promise<ClientDetails>;
  /** Client side: his own intake answers (never the coach's notes). */
  myDetails(clientId: string): Promise<{ client: Client; details: ClientDetails | null }>;
  /** Client side: saves his own intake answers. */
  updateMyDetails(clientId: string, patch: Partial<ClientDetails>): Promise<ClientDetails>;
  /** What his gym has. The client reads his own; a coach reads clients he may see. null = not listed yet. */
  gym(clientId: string): Promise<ClientGym | null>;
  /** The client lists his gym; a coach who may edit the client file can fix it. */
  saveGym(clientId: string, input: GymInput): Promise<ClientGym>;
  updateMyGoal(clientId: string, input: Pick<Client, "goal" | "target_weight_kg">): Promise<Client>;
  addNote(input: NewCoachNote): Promise<CoachNote>;
  updateNote(noteId: string, patch: Partial<Pick<CoachNote, "text" | "tags" | "pinned">>): Promise<CoachNote>;
  deleteNote(noteId: string): Promise<void>;
  progress(clientId: string): Promise<ClientProgress>;
  coachToday(coachId: string): Promise<CoachToday>;
  /** Client: all of his own data, as one file. */
  exportMine(clientId: string): Promise<MyDataExport>;
  /** Coach: every client he may see (team members: their assigned ones). Notes included; it's his data. */
  exportClients(coachId: string): Promise<ClientExportRow[]>;
}
