import type { HelperRole, NewTeamMember, OrgRole, TeamView } from "@coachi/validation";

export type TeamMemberOption = { member_id: string; name: string; role: OrgRole };

/** The coach's team. Everything but assign is owner only. */
export interface TeamApi {
  get(orgId: string): Promise<TeamView>;
  /** Names and roles only, for "Assigned to" pickers. Any team member can read it. */
  members(orgId: string): Promise<TeamMemberOption[]>;
  /** Makes an invite link to send on WhatsApp. Fails with limit_reached when seats are full. */
  invite(input: NewTeamMember): Promise<{ inviteUrl: string; code: string }>;
  cancelInvite(inviteId: string): Promise<void>;
  setRole(memberId: string, role: HelperRole): Promise<void>;
  /** Nothing is deleted: the member's clients go back to unassigned. */
  remove(memberId: string): Promise<void>;
  /** Owner and head coaches. memberId null = unassigned. */
  assign(clientId: string, memberId: string | null): Promise<void>;
}
