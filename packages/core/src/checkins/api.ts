import type { Checkin, CheckinForm } from "@coachi/validation";

export type CheckinInput = Pick<Checkin, "answers" | "weight_kg" | "photo_paths" | "note">;

export interface CheckinsApi {
  form(coachId: string): Promise<CheckinForm | null>;
  saveForm(coachId: string, input: Pick<CheckinForm, "questions" | "day_of_week">): Promise<CheckinForm>;
  /** The form a client fills, from his coach. */
  formForClient(clientId: string): Promise<CheckinForm | null>;
  list(clientId: string): Promise<Checkin[]>;
  submit(clientId: string, input: CheckinInput): Promise<Checkin>;
  reply(checkinId: string, text: string): Promise<Checkin>;
  markRead(checkinId: string): Promise<void>;
}
