import type {
  CoachCard,
  CoachLanding,
  CoachPackage,
  CoachPage,
  CoachProfile,
  CoachRequest,
  DirectoryFilters,
  PackageInput,
  SendRequest,
} from "@coachi/validation";

export interface DirectoryApi {
  /** Only active, approved (listed) coaches. */
  list(filters: DirectoryFilters): Promise<CoachCard[]>;
  get(coachId: string): Promise<CoachPage>;
  /** Public, no login: a published landing page of an active coach, else not_found. */
  landing(slug: string): Promise<CoachLanding>;
  sendRequest(input: SendRequest): Promise<CoachRequest>;
  myRequests(): Promise<CoachRequest[]>;
  /** Coach side. */
  inbox(coachId: string): Promise<CoachRequest[]>;
  answer(requestId: string, accept: boolean, reply?: string): Promise<CoachRequest>;
  myProfile(coachId: string): Promise<CoachProfile>;
  /** Fails with invalid "slug_taken" when another coach has the link. */
  updateProfile(coachId: string, patch: Partial<CoachProfile>): Promise<CoachProfile>;
  myPackages(coachId: string): Promise<CoachPackage[]>;
  /** Replaces the whole list, in order. Max MAX_PACKAGES. */
  savePackages(coachId: string, packages: PackageInput[]): Promise<CoachPackage[]>;
}
