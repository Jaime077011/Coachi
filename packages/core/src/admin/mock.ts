import type { AdminCoachRow } from "@coachi/validation";
import type { AdminApi } from "./api";
import {
  DEMO,
  auditLog,
  coachClients,
  coachLeads,
  coachProfiles,
  coachRequests,
  orgMembers,
  organizations,
  plans,
  profiles,
  settings,
  subscriptions,
  workoutLogs,
} from "../mock/data";
import { ApiError, mockRead, mockWrite, newId, nowIso } from "../mock/runtime";
import { uniqueSlug } from "../mock/session";

const DAY = 86_400_000;

function row(coach: (typeof coachProfiles)[number]): AdminCoachRow {
  const sub = subscriptions.find((s) => s.org_id === coach.org_id)!;
  const profile = profiles.find((p) => p.id === coach.profile_id);
  return {
    coach_id: coach.id,
    org_id: coach.org_id,
    name: coach.name,
    phone: profile?.phone ?? null,
    plan_name: plans.find((p) => p.id === sub.plan_id)?.name ?? "—",
    client_count: coachClients.filter((l) => l.coach_id === coach.id && !l.ended_at).length,
    status: sub.status,
    ends_at: sub.ends_at,
    last_active_at: coach.id === DEMO.coachId ? nowIso() : coach.updated_at,
    listed: coach.listed,
  };
}

const log = (action: string, target: string, support_mode = false) =>
  auditLog.unshift({ id: newId(), actor_id: DEMO.adminProfileId, action, target, meta: {}, support_mode, created_at: nowIso() });

const findCoach = (coachId: string) => {
  const coach = coachProfiles.find((c) => c.id === coachId);
  if (!coach) throw new ApiError("not_found");
  return coach;
};

export const mockAdmin: AdminApi = {
  coachLeads: () =>
    mockRead(() => coachLeads.filter((l) => !l.deleted_at).sort((a, b) => b.created_at.localeCompare(a.created_at)), []),

  setLeadStatus: (leadId, status) =>
    mockWrite(() => {
      const lead = coachLeads.find((l) => l.id === leadId);
      if (!lead) throw new ApiError("not_found");
      Object.assign(lead, { status, updated_at: nowIso() });
    }),

  overview: () =>
    mockRead(
      () => {
        const rows = coachProfiles.filter((c) => !c.deleted_at).map(row);
        const weekAgo = Date.now() - 7 * DAY;
        return {
          active_coaches: rows.filter((r) => r.status !== "expired" && r.status !== "paused").length,
          total_clients: coachClients.filter((l) => !l.ended_at).length,
          workouts_this_week: workoutLogs.filter((l) => Date.parse(l.started_at) >= weekAgo).length,
          ending_in_7_days: rows.filter((r) => {
            const left = Date.parse(r.ends_at) - Date.now();
            return left > 0 && left <= 7 * DAY;
          }).length,
          ending_soon: rows.filter((r) => r.status === "ending_soon"),
          newest: [...rows].reverse().slice(0, 3),
        };
      },
      { active_coaches: 0, total_clients: 0, workouts_this_week: 0, ending_in_7_days: 0, ending_soon: [], newest: [] },
    ),

  coaches: () => mockRead(() => coachProfiles.filter((c) => !c.deleted_at).map(row), []),


  addCoach: (input) =>
    mockWrite(() => {
      const stamp = { created_at: nowIso(), updated_at: nowIso(), deleted_at: null };
      const profileId = newId();
      const orgId = newId();
      profiles.push({ ...stamp, id: profileId, role: "coach", name: input.name, phone: input.phone, email: input.email ?? null, avatar_url: null, language: "ar", time_zone: "Africa/Cairo" });
      organizations.push({ ...stamp, id: orgId, name: input.name, type: "solo", logo_url: null, city: null });
      orgMembers.push({ ...stamp, id: newId(), org_id: orgId, profile_id: profileId, role: "owner", status: "active" });
      subscriptions.push({ ...stamp, id: newId(), org_id: orgId, plan_id: input.plan_id, status: "trial", starts_at: input.starts_at, ends_at: input.ends_at, source: "manual" });
      const coach = {
        ...stamp,
        id: newId(),
        org_id: orgId,
        profile_id: profileId,
        name: input.name,
        photo_url: null,
        bio: "",
        specialties: [],
        city: "Cairo",
        mode: "online" as const,
        gym: null,
        languages: ["ar" as const],
        years: 0,
        certificates: [],
        price_min_piasters: null,
        price_max_piasters: null,
        instagram: null,
        whatsapp: input.phone,
        gender: "male" as const,
        open_for_clients: false,
        listed: false,
        featured: false,
        slug: uniqueSlug(input.name),
        headline: null,
        cover_url: null,
        page_published: false,
        show_team: false,
      };
      coachProfiles.push(coach);
      log("coach.add", `coach:${input.name}`);
      return row(coach);
    }),

  setStatus: (orgId, status) =>
    mockWrite(() => {
      const sub = subscriptions.find((s) => s.org_id === orgId);
      if (!sub) throw new ApiError("not_found");
      sub.status = status;
      log(status === "paused" ? "coach.pause" : "coach.resume", `org:${orgId}`);
    }),

  changePlan: (orgId, planId) =>
    mockWrite(() => {
      const sub = subscriptions.find((s) => s.org_id === orgId);
      if (!sub) throw new ApiError("not_found");
      sub.plan_id = planId;
      log("coach.change_plan", `org:${orgId}`);
    }),

  extend: (orgId, days) =>
    mockWrite(() => {
      const sub = subscriptions.find((s) => s.org_id === orgId);
      if (!sub) throw new ApiError("not_found");
      sub.ends_at = new Date(Math.max(Date.now(), Date.parse(sub.ends_at)) + days * DAY).toISOString();
      if (sub.status === "expired" || sub.status === "ending_soon") sub.status = "active";
      log("coach.extend", `org:${orgId}`);
    }),

  deleteCoach: (coachId) =>
    mockWrite(() => {
      const coach = findCoach(coachId);
      coach.deleted_at = nowIso();
      coach.listed = false;
      log("coach.delete", `coach:${coach.name}`);
    }),

  settings: () => mockRead(() => settings[0]!),

  saveSettings: (input) =>
    mockWrite(() => {
      Object.assign(settings[0]!, input);
      log("settings.update", "app");
      return settings[0]!;
    }),

  directoryQueue: () =>
    mockRead(
      () =>
        coachProfiles.map((profile) => {
          const requests = coachRequests.filter((r) => r.coach_id === profile.id);
          return {
            profile,
            requests_total: requests.length,
            requests_accepted: requests.filter((r) => r.status === "accepted").length,
          };
        }),
      [],
    ),

  setListed: (coachId, listed) =>
    mockWrite(() => {
      const coach = findCoach(coachId);
      coach.listed = listed;
      log(listed ? "coach.approve" : "coach.hide", `coach:${coach.name}`);
    }),

  setFeatured: (coachId, featured) =>
    mockWrite(() => {
      const coach = findCoach(coachId);
      coach.featured = featured;
      log(featured ? "coach.feature" : "coach.unfeature", `coach:${coach.name}`);
    }),

  auditLog: () => mockRead(() => [...auditLog].sort((a, b) => b.created_at.localeCompare(a.created_at)), []),

  startSupport: (coachId) => mockWrite(() => void log("support.start", `coach:${findCoach(coachId).name}`, true)),

  endSupport: (coachId) => mockWrite(() => void log("support.end", `coach:${findCoach(coachId).name}`, true)),
};
