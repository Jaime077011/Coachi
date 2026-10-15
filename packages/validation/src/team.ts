import { z } from "zod";
import { orgMember, orgRole, type OrgRole } from "./auth-orgs";
import { invite } from "./clients";
import { phone, url } from "./common";

/**
 * What a team member can do, by role. The one table both sides use: the app hides what a role
 * can't do, and the Supabase row rules (Step 4) check the same list.
 */
export const teamPermission = z.enum([
  /** See every client of the org. Without it: only clients assigned to you. */
  "clients_all",
  "clients_invite",
  "clients_assign",
  /** Edit the client file and coach notes. */
  "client_edit",
  "plans_edit",
  "checkins_reply",
  "requests",
  "library_add",
  "checkin_form",
  "profile",
  "team",
  "subscription",
]);
export type TeamPermission = z.infer<typeof teamPermission>;

export const teamPermissions: Record<OrgRole, readonly TeamPermission[]> = {
  owner: teamPermission.options,
  head_coach: [
    "clients_all",
    "clients_invite",
    "clients_assign",
    "client_edit",
    "plans_edit",
    "checkins_reply",
    "requests",
    "library_add",
    "checkin_form",
  ],
  coach: ["client_edit", "plans_edit", "checkins_reply", "library_add"],
  assistant: ["checkins_reply"],
};

export function memberCan(role: OrgRole | null | undefined, permission: TeamPermission) {
  return !!role && teamPermissions[role].includes(permission);
}

/** Roles the owner can give. There is one owner: the coach who pays. */
export const helperRole = orgRole.exclude(["owner"]);
export type HelperRole = z.infer<typeof helperRole>;

/** "Invite helper": name, phone, and role. */
export const newTeamMember = z.object({
  name: z.string().min(2).max(80),
  phone,
  role: helperRole,
});
export type NewTeamMember = z.infer<typeof newTeamMember>;

export const teamMemberView = z.object({
  member: orgMember,
  name: z.string(),
  phone: phone.nullable(),
  avatar_url: url.nullable(),
  client_count: z.number().int().nonnegative(),
});
export type TeamMemberView = z.infer<typeof teamMemberView>;

/** The Team screen. Pending invites count as seats. */
export const teamView = z.object({
  /** null = unlimited. */
  seats_limit: z.number().int().nullable(),
  seats_used: z.number().int().nonnegative(),
  members: z.array(teamMemberView),
  invites: z.array(invite),
});
export type TeamView = z.infer<typeof teamView>;
