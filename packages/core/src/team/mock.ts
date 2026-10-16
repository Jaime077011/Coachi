import type { TeamView } from "@coachi/validation";
import type { TeamApi } from "./api";
import { DEMO, coachClients, invites, orgMembers, profiles, subscriptions } from "../mock/data";
import { ApiError, mockRead, mockWrite, newId, nowIso } from "../mock/runtime";
import { activeMembers, requireActiveSubscription, requireMember } from "../mock/session";

const DAY = 86_400_000;

/** Team seats he bought (helpers; the owner doesn't take one). */
const seatsLimit = (orgId: string): number | null => subscriptions.find((s) => s.org_id === orgId)?.team_seats ?? 0;

const pendingInvites = (orgId: string) =>
  invites.filter((i) => i.org_id === orgId && i.kind === "team" && !i.used_by && !i.deleted_at && Date.parse(i.expires_at) > Date.now());

/** Pending invites hold a seat, so the coach can't send more links than he has seats. */
const seatsUsed = (orgId: string) =>
  activeMembers(orgId).filter((m) => m.role !== "owner").length + pendingInvites(orgId).length;

const findHelper = (memberId: string) => {
  const member = orgMembers.find((m) => m.id === memberId && m.status === "active");
  if (!member) throw new ApiError("not_found");
  if (member.role === "owner") throw new ApiError("forbidden");
  return member;
};

export const mockTeam: TeamApi = {
  get: (orgId) =>
    mockRead<TeamView>(
      () => {
        requireMember("team");
        const roleOrder = { owner: 0, head_coach: 1, coach: 2, assistant: 3 };
        return {
          seats_limit: seatsLimit(orgId),
          seats_used: seatsUsed(orgId),
          members: activeMembers(orgId)
            .sort((a, b) => roleOrder[a.role] - roleOrder[b.role])
            .map((member) => {
              const p = profiles.find((x) => x.id === member.profile_id)!;
              return {
                member,
                name: p.name,
                phone: p.phone,
                avatar_url: p.avatar_url,
                client_count: coachClients.filter((l) => l.assigned_member_id === member.id && !l.ended_at).length,
              };
            }),
          invites: pendingInvites(orgId).sort((a, b) => b.created_at.localeCompare(a.created_at)),
        };
      },
      // Empty state: only the owner, no helpers.
      { seats_limit: 5, seats_used: 0, members: [], invites: [] },
    ),

  members: (orgId) =>
    mockRead(
      () =>
        activeMembers(orgId).map((m) => ({
          member_id: m.id,
          name: profiles.find((p) => p.id === m.profile_id)?.name ?? "",
          role: m.role,
        })),
      [],
    ),

  invite: (input) =>
    mockWrite(() => {
      const session = requireMember("team");
      requireActiveSubscription();
      const orgId = session.org_id!;
      const limit = seatsLimit(orgId);
      if (limit !== null && seatsUsed(orgId) >= limit) throw new ApiError("limit_reached");
      const code = `TEAM-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
      invites.push({
        id: newId(),
        org_id: orgId,
        coach_id: session.coach_id!,
        kind: "team",
        member_role: input.role,
        code,
        name: input.name,
        phone: input.phone,
        expires_at: new Date(Date.now() + 7 * DAY).toISOString(),
        used_by: null,
        created_at: nowIso(),
        updated_at: nowIso(),
        deleted_at: null,
      });
      const origin = globalThis.location?.origin ?? "https://coachi.app";
      return { inviteUrl: `${origin}/join/${code}`, code };
    }),

  cancelInvite: (inviteId) =>
    mockWrite(() => {
      requireMember("team");
      const invite = invites.find((i) => i.id === inviteId && i.kind === "team");
      if (invite) invite.deleted_at = nowIso();
    }),

  setRole: (memberId, role) =>
    mockWrite(() => {
      requireMember("team");
      Object.assign(findHelper(memberId), { role, updated_at: nowIso() });
    }),

  remove: (memberId) =>
    mockWrite(() => {
      requireMember("team");
      const member = findHelper(memberId);
      member.status = "removed";
      member.updated_at = nowIso();
      for (const link of coachClients) if (link.assigned_member_id === memberId) link.assigned_member_id = null;
    }),

  assign: (clientId, memberId) =>
    mockWrite(() => {
      const session = requireMember("clients_assign");
      const link = coachClients.find((l) => l.client_id === clientId && l.org_id === session.org_id && !l.ended_at);
      if (!link) throw new ApiError("not_found");
      if (memberId !== null && !activeMembers(session.org_id ?? DEMO.orgId).some((m) => m.id === memberId)) {
        throw new ApiError("not_found");
      }
      link.assigned_member_id = memberId;
      link.updated_at = nowIso();
    }),
};
