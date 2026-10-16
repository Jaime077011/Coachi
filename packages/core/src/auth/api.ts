import type { LoginRequest, OrgRole, Session, VerifyCode } from "@coachi/validation";

export type InviteLanding = {
  code: string;
  coach_name: string;
  coach_photo_url: string | null;
  coach_logo_url: string | null;
  expired: boolean;
  /** "team" = a helper joining the coach's team with member_role. */
  kind: "client" | "team";
  member_role: OrgRole | null;
};

export interface AuthApi {
  /** null = signed out. */
  getSession(): Promise<Session | null>;
  /** Sends a 6-digit code by SMS/WhatsApp (phone) or a magic link + code (email). */
  requestCode(input: LoginRequest): Promise<{ sentTo: string }>;
  /** Logs in, or signs up: a number or email we don't know makes a new client account (name ""). */
  verifyCode(input: VerifyCode): Promise<Session>;
  /** Welcome step after the first login: his name (and screen language). */
  completeProfile(input: { name: string; language: "ar" | "en" }): Promise<Session>;
  signOut(): Promise<void>;
  getInvite(code: string): Promise<InviteLanding>;
  /** After login from a team invite: joins the coach's team with the invite's role. */
  acceptTeamInvite(code: string): Promise<void>;
}
