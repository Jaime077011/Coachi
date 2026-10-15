import type {
  Client,
  ClientDetails,
  ClientFile,
  ClientProgress,
  ClientStatus,
  ClientSummary,
  CoachNote,
  CoachToday,
  NewClient,
  NewCoachNote,
} from "@coachi/validation";

export interface ClientsApi {
  list(coachId: string): Promise<ClientSummary[]>;
  get(clientId: string): Promise<ClientFile>;
  /** Makes an invite link to send on WhatsApp. Fails with limit_reached at the plan's client limit. */
  invite(input: NewClient): Promise<{ inviteUrl: string; code: string }>;
  setStatus(clientId: string, status: ClientStatus): Promise<void>;
  updateDetails(clientId: string, patch: Partial<ClientDetails>): Promise<ClientDetails>;
  /** Client side: his own intake answers (never the coach's notes). */
  myDetails(clientId: string): Promise<{ client: Client; details: ClientDetails | null }>;
  updateMyGoal(clientId: string, input: Pick<Client, "goal" | "target_weight_kg">): Promise<Client>;
  addNote(input: NewCoachNote): Promise<CoachNote>;
  updateNote(noteId: string, patch: Partial<Pick<CoachNote, "text" | "tags" | "pinned">>): Promise<CoachNote>;
  deleteNote(noteId: string): Promise<void>;
  progress(clientId: string): Promise<ClientProgress>;
  coachToday(coachId: string): Promise<CoachToday>;
}
