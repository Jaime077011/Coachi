import type { LoginRequest, Session, VerifyCode } from "@coachi/validation";

export type InviteLanding = {
  code: string;
  coach_name: string;
  coach_photo_url: string | null;
  coach_logo_url: string | null;
  expired: boolean;
};

export interface AuthApi {
  /** null = signed out. */
  getSession(): Promise<Session | null>;
  /** Sends a 6-digit code by SMS/WhatsApp (phone) or a magic link + code (email). */
  requestCode(input: LoginRequest): Promise<{ sentTo: string }>;
  verifyCode(input: VerifyCode): Promise<Session>;
  signOut(): Promise<void>;
  getInvite(code: string): Promise<InviteLanding>;
}
