import type { Session } from "@coachi/validation";
import type { AuthApi } from "./api";
import { DEMO, coachProfiles, invites, profiles } from "../mock/data";
import { ApiError, getMockRole, mockAuthRead, mockRead, mockWrite } from "../mock/runtime";

function sessionFor(role: ReturnType<typeof getMockRole>): Session {
  const profileId =
    role === "super_admin" ? DEMO.adminProfileId : role === "client" ? DEMO.clientProfileId : DEMO.coachProfileId;
  const profile = profiles.find((p) => p.id === profileId)!;
  return {
    profile,
    org_id: role === "coach" ? DEMO.orgId : null,
    coach_id: role === "coach" ? DEMO.coachId : null,
    client_id: role === "client" ? DEMO.clientId : null,
  };
}

export const mockAuth: AuthApi = {
  getSession: () => mockAuthRead(() => sessionFor(getMockRole())),

  requestCode: (input) =>
    mockWrite(() => ({ sentTo: input.method === "phone" ? input.phone : input.email })),

  verifyCode: (input) =>
    mockWrite(() => {
      // In mock mode any 6 digits work except 000000, which tests the wrong-code state.
      if (input.code === "000000") throw new ApiError("invalid", "wrong_code");
      return sessionFor(getMockRole());
    }),

  signOut: () => mockWrite(() => undefined),

  getInvite: (code) =>
    mockRead(() => {
      const invite = invites.find((i) => i.code === code);
      const coach = coachProfiles.find((c) => c.id === (invite?.coach_id ?? DEMO.coachId))!;
      return {
        code,
        coach_name: coach.name,
        coach_photo_url: coach.photo_url,
        coach_logo_url: null,
        expired: !invite || new Date(invite.expires_at) < new Date(),
      };
    }),
};
