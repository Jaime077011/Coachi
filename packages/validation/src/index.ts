/**
 * Zod shapes for everything Coachi shows or stores — the contract with the future database.
 * Field names match the Full Spec's table columns (snake_case), so Supabase types line up 1:1.
 */
export * from "./common";
export * from "./auth-orgs";
export * from "./billing";
export * from "./directory";
export * from "./team";
export * from "./gym";
export * from "./clients";
export * from "./training";
export * from "./nutrition";
export * from "./progress-checkins";
export * from "./journey";
export * from "./platform";
export * from "./views";
