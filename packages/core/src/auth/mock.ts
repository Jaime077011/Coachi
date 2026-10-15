import type { AuthApi } from "./api";
import { coachProfiles, invites, orgMembers, profiles } from "../mock/data";
import { ApiError, mockAuthRead, mockRead, mockWrite, newId, nowIso } from "../mock/runtime";
import { clientBrandLogo, mockSession } from "../mock/session";

export const mockAuth: AuthApi = {
  getSession: () => mockAuthRead(mockSession),

  requestCode: (input) =>
    mockWrite(() => ({ sentTo: input.method === "phone" ? input.phone : input.email })),

  verifyCode: (input) =>
    mockWrite(() => {
      // In mock mode any 6 digits work except 000000, which tests the wrong-code state.
      if (input.code === "000000") throw new ApiError("invalid", "wrong_code");
      return mockSession();
    }),

  signOut: () => mockWrite(() => undefined),

  getInvite: (code) =>
    mockRead(() => {
      const invite = invites.find((i) => i.code === code && !i.deleted_at);
      const coach = coachProfiles.find((c) => c.id === invite?.coach_id) ?? coachProfiles[0]!;
      return {
        code,
        coach_name: coach.name,
        coach_photo_url: coach.photo_url,
        coach_logo_url: clientBrandLogo(coach.org_id),
        expired: !invite || !!invite.used_by || new Date(invite.expires_at) < new Date(),
        kind: invite?.kind ?? "client",
        member_role: invite?.member_role ?? null,
      };
    }),

  acceptTeamInvite: (code) =>
    mockWrite(() => {
      const invite = invites.find((i) => i.code === code && i.kind === "team" && !i.used_by && !i.deleted_at);
      if (!invite || !invite.member_role) throw new ApiError("not_found");
      // Mock: the helper's profile is made from the invite. Supabase uses the signed-in user.
      const stamp = { created_at: nowIso(), updated_at: nowIso(), deleted_at: null };
      const profileId = newId();
      profiles.push({ ...stamp, id: profileId, role: "coach", name: invite.name, phone: invite.phone, email: null, avatar_url: null, language: "ar", time_zone: "Africa/Cairo" });
      orgMembers.push({ ...stamp, id: newId(), org_id: invite.org_id, profile_id: profileId, role: invite.member_role, status: "active" });
      invite.used_by = profileId;
      invite.updated_at = nowIso();
    }),
};
