import type { AdminCoachRow, AdminOverview, AppSettings, AuditEntry, CoachLead, CoachLeadStatus, DirectoryQueueItem, Subscription } from "@coachi/validation";

export type NewCoach = {
  name: string;
  phone: string;
  email?: string;
  /** New coaches start on the trial seats; the admin can change them. */
  client_seats: number;
  team_seats: number;
  starts_at: string;
  ends_at: string;
};

/** Super admin only. In Supabase every call here runs on the server and writes audit_log. */
export interface AdminApi {
  overview(): Promise<AdminOverview>;
  coaches(): Promise<AdminCoachRow[]>;
  addCoach(input: NewCoach): Promise<AdminCoachRow>;
  setStatus(orgId: string, status: Extract<Subscription["status"], "active" | "paused">): Promise<void>;
  /** Change seats without a payment (e.g. a few extra clients until he renews). */
  setSeats(orgId: string, seats: { client_seats: number; team_seats: number }): Promise<void>;
  /** Add days without a payment (goodwill, trial extension). */
  extend(orgId: string, days: number): Promise<void>;
  /** Soft delete: the coach disappears, nothing is erased. */
  deleteCoach(coachId: string): Promise<void>;
  settings(): Promise<AppSettings>;
  saveSettings(input: AppSettings): Promise<AppSettings>;
  directoryQueue(): Promise<DirectoryQueueItem[]>;
  setListed(coachId: string, listed: boolean): Promise<void>;
  setFeatured(coachId: string, featured: boolean): Promise<void>;
  auditLog(): Promise<AuditEntry[]>;
  /** Coaches who asked to join from the home page, newest first. */
  coachLeads(): Promise<CoachLead[]>;
  setLeadStatus(leadId: string, status: CoachLeadStatus): Promise<void>;
  startSupport(coachId: string): Promise<void>;
  endSupport(coachId: string): Promise<void>;
}
