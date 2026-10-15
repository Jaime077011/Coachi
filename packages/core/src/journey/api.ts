import type { BodyMetric, ClientToday, JourneyMessage, JourneySummary } from "@coachi/validation";

export type NewBodyMetric = Pick<BodyMetric, "date" | "weight_kg" | "waist_cm" | "photo_paths">;

export interface JourneyApi {
  /** Everything on the client's Today screen in one call. */
  today(clientId: string): Promise<ClientToday>;
  addWater(clientId: string, date: string, glasses: number): Promise<number>;
  journey(clientId: string): Promise<JourneySummary>;
  addBodyMetric(clientId: string, input: NewBodyMetric): Promise<BodyMetric>;
  /** Coach pins a short message to the client's journey. */
  addCoachMessage(clientId: string, text: string): Promise<JourneyMessage>;
}
