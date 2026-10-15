/**
 * Who is signed in, in mock mode, and what they may see. Stands in for Supabase Auth plus the
 * row rules: the Supabase version gets the same answers from auth.uid() and org_members.
 */
import { memberCan, type Session, type TeamPermission } from "@coachi/validation";
import { DEMO, coachClients, coachProfiles, orgMembers, profiles } from "./data";
import { ApiError, getMockMemberRole, getMockRole } from "./runtime";

export function mockSession(): Session {
  const role = getMockRole();
  if (role !== "coach") {
    const profileId = role === "super_admin" ? DEMO.adminProfileId : DEMO.clientProfileId;
    return {
      profile: profiles.find((p) => p.id === profileId)!,
      org_id: null,
      coach_id: null,
      client_id: role === "client" ? DEMO.clientId : null,
      member_id: null,
      member_role: null,
    };
  }
  const memberRole = getMockMemberRole();
  const { memberId, profileId } = DEMO.members[memberRole];
  return {
    profile: profiles.find((p) => p.id === profileId)!,
    org_id: DEMO.orgId,
    coach_id: DEMO.coachId,
    client_id: null,
    member_id: memberId,
    member_role: memberRole,
  };
}

/** Like a row rule: throws forbidden when the signed-in member's role doesn't allow it. */
export function requireMember(permission: TeamPermission) {
  const session = mockSession();
  if (!memberCan(session.member_role, permission)) throw new ApiError("forbidden");
  return session;
}

/** Live links between the coach and his clients that the signed-in member may see. */
export function visibleLinks(coachId: string) {
  const session = mockSession();
  return coachClients.filter(
    (l) =>
      l.coach_id === coachId &&
      l.ended_at === null &&
      (session.member_role === null ||
        memberCan(session.member_role, "clients_all") ||
        l.assigned_member_id === session.member_id),
  );
}

export function canSeeClient(clientId: string) {
  const session = mockSession();
  if (session.member_role === null) return true;
  const link = coachClients.find((l) => l.client_id === clientId && l.org_id === session.org_id && !l.ended_at);
  if (!link) return false;
  return memberCan(session.member_role, "clients_all") || link.assigned_member_id === session.member_id;
}

/** Active team members of an org, owner included. */
export const activeMembers = (orgId: string) => orgMembers.filter((m) => m.org_id === orgId && m.status === "active");

/** "Ahmed Samir" → "ahmed-samir"; Arabic-only names get "coach-xxxx". Always unique. */
export function uniqueSlug(name: string) {
  const base =
    name
      .toLowerCase()
      .replace(/^(coach|captain)\s+/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || `coach-${Math.random().toString(36).slice(2, 6)}`;
  let slug = base.length >= 3 ? base : `coach-${base}`;
  for (let n = 2; coachProfiles.some((c) => c.slug === slug); n++) slug = `${base}-${n}`;
  return slug;
}
