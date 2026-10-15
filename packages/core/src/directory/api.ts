import type {
  CoachCard,
  CoachPage,
  CoachProfile,
  CoachRequest,
  DirectoryFilters,
  SendRequest,
} from "@coachi/validation";

export interface DirectoryApi {
  /** Only active, approved (listed) coaches. */
  list(filters: DirectoryFilters): Promise<CoachCard[]>;
  get(coachId: string): Promise<CoachPage>;
  sendRequest(input: SendRequest): Promise<CoachRequest>;
  myRequests(): Promise<CoachRequest[]>;
  /** Coach side. */
  inbox(coachId: string): Promise<CoachRequest[]>;
  answer(requestId: string, accept: boolean, reply?: string): Promise<CoachRequest>;
  myProfile(coachId: string): Promise<CoachProfile>;
  updateProfile(coachId: string, patch: Partial<CoachProfile>): Promise<CoachProfile>;
}
