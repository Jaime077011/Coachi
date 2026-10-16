import type { AuthApi } from "./api";
import { DEMO, clients, coachProfiles, invites, orgMembers, profiles } from "../mock/data";
import {
  ApiError,
  isMockSignedOut,
  mockAuthRead,
  mockRead,
  mockWrite,
  newId,
  nowIso,
  setMockClientProfile,
  setMockMemberRole,
  setMockRole,
  setMockSignedOut,
  type MockMemberRole,
} from "../mock/runtime";
import { clientBrandLogo, mockSession } from "../mock/session";

export const mockAuth: AuthApi = {
  getSession: () => mockAuthRead(() => (isMockSignedOut() ? null : mockSession())),

  requestCode: (input) =>
    mockWrite(() => ({ sentTo: input.method === "phone" ? input.phone : input.email })),

  verifyCode: (input) =>
    mockWrite(() => {
      // In mock mode any 6 digits work except 000000, which tests the wrong-code state.
      if (input.code === "000000") throw new ApiError("invalid", "wrong_code");
      const known = profiles.find((p) => p.phone === input.target || (p.email && p.email === input.target));
      if (!known) {
        // Sign-up: a new client with no coach yet. The welcome step asks his name.
        const stamp = { created_at: nowIso(), updated_at: nowIso(), deleted_at: null };
        const profileId = newId();
        const isEmail = input.target.includes("@");
        profiles.push({ ...stamp, id: profileId, role: "client", name: "", phone: isEmail ? null : input.target, email: isEmail ? input.target : null, avatar_url: null, language: "ar", time_zone: "Africa/Cairo" });
        clients.push({ ...stamp, id: newId(), profile_id: profileId, status: "active", goal: null, target_weight_kg: null, target_date: null });
        setMockRole("client");
        setMockClientProfile(profileId);
      } else if (known.role === "client") {
        setMockRole("client");
        setMockClientProfile(known.id);
      } else if (known.role === "super_admin") {
        setMockRole("super_admin");
      } else {
        // Coaches: the demo coach's team signs in by role. Other coaches' accounts aren't in the mock.
        const member = Object.entries(DEMO.members).find(([, m]) => m.profileId === known.id);
        setMockRole("coach");
        if (member) setMockMemberRole(member[0] as MockMemberRole);
      }
      setMockSignedOut(false);
      return mockSession();
    }),

  completeProfile: (input) =>
    mockWrite(() => {
      const session = mockSession();
      const profile = profiles.find((p) => p.id === session.profile.id);
      if (!profile) throw new ApiError("not_found");
      Object.assign(profile, { name: input.name.trim().slice(0, 80), language: input.language, updated_at: nowIso() });
      return mockSession();
    }),

  signOut: () => mockWrite(() => setMockSignedOut(true)),

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
      // The mock signs in as the demo team member with the same role.
      setMockRole("coach");
      setMockMemberRole(invite.member_role);
    }),
};
