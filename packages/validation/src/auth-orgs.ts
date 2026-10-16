import { z } from "zod";
import { base, email, id, locale, orgScoped, phone, url } from "./common";

export const role = z.enum(["super_admin", "coach", "client"]);
export type Role = z.infer<typeof role>;

/** One login for any role. Login works by phone code or email magic link, so either may be set. */
export const profile = base.extend({
  role,
  /** "" right after the first login, until the welcome step asks for it. */
  name: z.string().max(80),
  phone: phone.nullable(),
  email: email.nullable(),
  avatar_url: url.nullable(),
  language: locale,
  time_zone: z.string().default("Africa/Cairo"),
});
export type Profile = z.infer<typeof profile>;

export const organization = base.extend({
  name: z.string().min(1).max(80),
  type: z.enum(["solo", "gym"]),
  logo_url: url.nullable(),
  city: z.string().nullable(),
});
export type Organization = z.infer<typeof organization>;

/** Team roles inside a coach's org. What each can do lives in team.ts. */
export const orgRole = z.enum(["owner", "head_coach", "coach", "assistant"]);
export type OrgRole = z.infer<typeof orgRole>;

export const orgMember = orgScoped.extend({
  profile_id: id,
  role: orgRole,
  /** Removed members keep their row, so notes and plans still show who wrote them. */
  status: z.enum(["active", "removed"]),
});
export type OrgMember = z.infer<typeof orgMember>;

/** Login: phone code (main) or email magic link (fallback). */
export const loginRequest = z.discriminatedUnion("method", [
  z.object({ method: z.literal("phone"), phone }),
  z.object({ method: z.literal("email"), email }),
]);
export type LoginRequest = z.infer<typeof loginRequest>;

export const verifyCode = z.object({
  method: z.enum(["phone", "email"]),
  target: z.string().min(1),
  code: z.string().regex(/^\d{6}$/),
});
export type VerifyCode = z.infer<typeof verifyCode>;

/** What the app knows about the signed-in user. */
export const session = z.object({
  profile,
  org_id: id.nullable(),
  coach_id: id.nullable(),
  /** Set when the role is client. */
  client_id: id.nullable(),
  /** Coach side: the signed-in person's team membership. The owner is a member too. */
  member_id: id.nullable(),
  member_role: orgRole.nullable(),
});
export type Session = z.infer<typeof session>;
