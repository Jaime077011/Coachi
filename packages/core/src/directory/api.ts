import type {
  CoachCard,
  CoachLanding,
  CoachPackage,
  CoachPage,
  CoachProfile,
  CoachRequest,
  CoachLead,
  NewCoachLead,
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
  /** Public, no login: "I'm a coach" form on the Coachi home page. Rate limited in Step 3. */
  requestCoachAccess(input: NewCoachLead): Promise<CoachLead>;
  myRequests(): Promise<CoachRequest[]>;
  /** Coach side. */
  inbox(coachId: string): Promise<CoachRequest[]>;
  answer(requestId: string, accept: boolean, reply?: string): Promise<CoachRequest>;
  myProfile(coachId: string): Promise<CoachProfile>;
  /** Fails with invalid "slug_taken" when another coach has the link. */
  updateProfile(coachId: string, patch: Partial<CoachProfile>): Promise<CoachProfile>;
  myPackages(coachId: string): Promise<CoachPackage[]>;
  /** The org logo, shown in the client app when the plan has branded_app. */
  brand(orgId: string): Promise<{ logo_url: string | null; branded_app: boolean }>;
  setLogo(orgId: string, logoUrl: string | null): Promise<void>;
  /** Replaces the whole list, in order. Max MAX_PACKAGES. */
  savePackages(coachId: string, packages: PackageInput[]): Promise<CoachPackage[]>;
}
