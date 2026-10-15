import { z } from "zod";
import { base, email, id, locale, orgScoped, phone, url } from "./common";

export const role = z.enum(["super_admin", "coach", "client"]);
export type Role = z.infer<typeof role>;

/** One login for any role. Login works by phone code or email magic link, so either may be set. */
export const profile = base.extend({
  role,
  name: z.string().min(1).max(80),
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

export const orgRole = z.enum(["owner", "head_coach", "coach", "assistant"]);

export const orgMember = orgScoped.extend({
  profile_id: id,
  role: orgRole,
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
});
export type Session = z.infer<typeof session>;
