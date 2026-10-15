/**
 * The one typed API every screen uses. Two versions: mock now, Supabase in Step 4.
 * Screens call api.<module>.<method>() through TanStack Query and never import mock data.
 */
import type { AdminApi } from "./admin/api";
import type { AuthApi } from "./auth/api";
import type { BillingApi } from "./billing/api";
import type { CheckinsApi } from "./checkins/api";
import type { ClientsApi } from "./clients/api";
import type { DirectoryApi } from "./directory/api";
import type { JourneyApi } from "./journey/api";
import type { NutritionApi } from "./nutrition/api";
import type { TeamApi } from "./team/api";
import type { TrainingApi } from "./training/api";
import { mockAdmin } from "./admin/mock";
import { mockAuth } from "./auth/mock";
import { mockBilling } from "./billing/mock";
import { mockCheckins } from "./checkins/mock";
import { mockClients } from "./clients/mock";
import { mockDirectory } from "./directory/mock";
import { mockJourney } from "./journey/mock";
import { mockNutrition } from "./nutrition/mock";
import { mockTeam } from "./team/mock";
import { mockTraining } from "./training/mock";
import "./mock/persist";

export type Api = {
  auth: AuthApi;
  clients: ClientsApi;
  team: TeamApi;
  directory: DirectoryApi;
  training: TrainingApi;
  nutrition: NutritionApi;
  journey: JourneyApi;
  checkins: CheckinsApi;
  billing: BillingApi;
  admin: AdminApi;
};

export type DataSource = "mock" | "supabase";
export const dataSource: DataSource = process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase" ? "supabase" : "mock";

// Step 4: swap each module to its Supabase version as it is built, e.g.
//   clients: dataSource === "supabase" ? supabaseClients : mockClients,
export const api: Api = {
  auth: mockAuth,
  clients: mockClients,
  team: mockTeam,
  directory: mockDirectory,
  training: mockTraining,
  nutrition: mockNutrition,
  journey: mockJourney,
  checkins: mockCheckins,
  billing: mockBilling,
  admin: mockAdmin,
};

export type { AdminApi, NewCoach } from "./admin/api";
export type { AuthApi, InviteLanding } from "./auth/api";
export type { BillingApi } from "./billing/api";
export type { CheckinInput, CheckinsApi } from "./checkins/api";
export type { ClientsApi } from "./clients/api";
export type { DirectoryApi } from "./directory/api";
export type { JourneyApi, NewBodyMetric } from "./journey/api";
export type { MealLogInput, NewFood, NutritionApi } from "./nutrition/api";
export type { NewExercise, SetInput, TrainingApi } from "./training/api";
export type { TeamApi, TeamMemberOption } from "./team/api";
export {
  ApiError,
  getMockDataState,
  getMockMemberRole,
  getMockRole,
  setMockDataState,
  setMockMemberRole,
  setMockRole,
  type MockDataState,
  type MockMemberRole,
  type MockRole,
} from "./mock/runtime";
export { resetMockDatabase } from "./mock/persist";
export { dayInProgram } from "./journey/schedule";
/** Demo ids for mock mode only (the signed-in coach, client, and org). */
export { DEMO } from "./mock/data";
