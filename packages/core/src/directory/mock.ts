import { MAX_PACKAGES, type CoachCard } from "@coachi/validation";
import type { DirectoryApi } from "./api";
import {
  DEMO,
  clients,
  coachClients,
  coachLeads,
  coachPackages,
  coachProfiles,
  coachRequests,
  coachResults,
  organizations,
  planFeatures,
  profiles,
  subscriptions,
} from "../mock/data";
import { ApiError, getMockRole, mockRead, mockWrite, newId, nowIso } from "../mock/runtime";
import { activeMembers, requireMember } from "../mock/session";
import { clientProfileId, notify } from "../mock/notify";

const packagesOf = (coachId: string) =>
  coachPackages.filter((p) => p.coach_id === coachId && !p.deleted_at).sort((a, b) => a.order - b.order);

/** The landing page shows only while the coach can work: trial, active, or ending soon. */
const isActiveCoach = (orgId: string) => {
  const status = subscriptions.find((s) => s.org_id === orgId)?.status;
  return status === "trial" || status === "active" || status === "ending_soon";
};

const toCard = (c: (typeof coachProfiles)[number]): CoachCard => ({
  id: c.id,
  name: c.name,
  photo_url: c.photo_url,
  specialties: c.specialties,
  city: c.city,
  mode: c.mode,
  price_min_piasters: c.price_min_piasters,
  price_max_piasters: c.price_max_piasters,
  featured: c.featured,
  gender: c.gender,
  languages: c.languages,
});

const goalToSpecialty = { fat_loss: "fat_loss", muscle: "muscle", strength: "strength", health: null } as const;

/** In mock mode, the directory belongs to whichever client is browsing. */
const browsingClientId = () => (getMockRole() === "client" ? DEMO.clientId : DEMO.loneClientId);

const findCoach = (coachId: string) => {
  const coach = coachProfiles.find((c) => c.id === coachId);
  if (!coach) throw new ApiError("not_found");
  return coach;
};

export const mockDirectory: DirectoryApi = {
  list: (filters) =>
    mockRead(
      () =>
        coachProfiles
          .filter((c) => c.listed)
          .filter((c) => {
            const q = filters.search?.trim().toLowerCase();
            if (q && !`${c.name} ${c.city} ${c.bio}`.toLowerCase().includes(q)) return false;
            if (filters.city && c.city !== filters.city) return false;
            if (filters.mode && c.mode !== filters.mode && c.mode !== "both") return false;
            if (filters.women_coaches && c.gender !== "female") return false;
            if (filters.language && !c.languages.includes(filters.language)) return false;
            if (filters.max_price_piasters && (c.price_min_piasters ?? 0) > filters.max_price_piasters) return false;
            const specialty = filters.goal ? goalToSpecialty[filters.goal] : null;
            if (specialty && !c.specialties.includes(specialty)) return false;
            return true;
          })
          .sort((a, b) => Number(b.featured) - Number(a.featured))
          .map(toCard),
      [],
    ),

  get: (coachId) =>
    mockRead(() => ({
      profile: findCoach(coachId),
      packages: packagesOf(coachId),
      results: coachResults.filter((r) => r.coach_id === coachId),
      my_request:
        coachRequests.find((r) => r.coach_id === coachId && r.client_id === browsingClientId()) ?? null,
    })),

  landing: (slug) =>
    mockRead(() => {
      const coach = coachProfiles.find((c) => c.slug === slug.toLowerCase() && !c.deleted_at);
      if (!coach || !coach.page_published || !isActiveCoach(coach.org_id)) throw new ApiError("not_found");
      const { listed: _listed, featured: _featured, ...profile } = coach;
      return {
        profile,
        packages: packagesOf(coach.id),
        results: coachResults.filter((r) => r.coach_id === coach.id),
        team: coach.show_team
          ? activeMembers(coach.org_id)
              .filter((m) => m.role !== "owner")
              .map((m) => {
                const p = profiles.find((x) => x.id === m.profile_id)!;
                return { name: p.name, role: m.role, avatar_url: p.avatar_url };
              })
          : [],
      };
    }),

  requestCoachAccess: (input) =>
    mockWrite(() => {
      const lead = { ...input, id: newId(), status: "new" as const, created_at: nowIso(), updated_at: nowIso(), deleted_at: null };
      coachLeads.push(lead);
      return lead;
    }),

  sendRequest: (input) =>
    mockWrite(() => {
      const clientId = browsingClientId();
      const client = clients.find((c) => c.id === clientId)!;
      const request = {
        ...input,
        source: input.source ?? ("directory" as const),
        package_id: input.package_id ?? null,
        id: newId(),
        client_id: clientId,
        client_name: profiles.find((p) => p.id === client.profile_id)!.name,
        client_phone: input.contact_by === "whatsapp" ? (profiles.find((p) => p.id === client.profile_id)!.phone ?? null) : null,
        status: "sent" as const,
        reply: null,
        created_at: nowIso(),
        updated_at: nowIso(),
        deleted_at: null,
      };
      coachRequests.push(request);
      notify(coachProfiles.find((c) => c.id === request.coach_id)?.profile_id, "request_new", { name: request.client_name }, "/coach/requests");
      return request;
    }),

  myRequests: () => mockRead(() => coachRequests.filter((r) => r.client_id === browsingClientId()), []),

  inbox: (coachId) =>
    mockRead(
      () => {
        requireMember("requests");
        return coachRequests
          .filter((r) => r.coach_id === coachId)
          .sort((a, b) => b.created_at.localeCompare(a.created_at));
      },
      [],
    ),

  answer: (requestId, accept, reply) =>
    mockWrite(() => {
      requireMember("requests");
      const request = coachRequests.find((r) => r.id === requestId);
      if (!request) throw new ApiError("not_found");
      request.status = accept ? "accepted" : "declined";
      request.reply = reply ?? null;
      request.updated_at = nowIso();
      if (accept) linkClient(request);
      notify(
        clientProfileId(request.client_id),
        "request_answered",
        { coach: coachProfiles.find((c) => c.id === request.coach_id)?.name ?? "", accepted: accept ? "yes" : "no" },
        accept ? "/app/intake" : "/app/coaches",
      );
      return request;
    }),

  myProfile: (coachId) => mockRead(() => findCoach(coachId)),

  updateProfile: (coachId, patch) =>
    mockWrite(() => {
      requireMember("profile");
      const coach = findCoach(coachId);
      if (patch.slug && coachProfiles.some((c) => c.id !== coachId && c.slug === patch.slug)) {
        throw new ApiError("invalid", "slug_taken");
      }
      Object.assign(coach, patch, { updated_at: nowIso() });
      return coach;
    }),

  myPackages: (coachId) => mockRead(() => packagesOf(coachId), []),

  brand: (orgId) =>
    mockRead(() => {
      const sub = subscriptions.find((s) => s.org_id === orgId);
      return {
        logo_url: organizations.find((o) => o.id === orgId)?.logo_url ?? null,
        branded_app: planFeatures.find((f) => f.plan_id === sub?.plan_id && f.key === "branded_app")?.value === true,
      };
    }),

  setLogo: (orgId, logoUrl) =>
    mockWrite(() => {
      requireMember("profile");
      const org = organizations.find((o) => o.id === orgId);
      if (!org) throw new ApiError("not_found");
      org.logo_url = logoUrl;
      org.updated_at = nowIso();
    }),

  savePackages: (coachId, input) =>
    mockWrite(() => {
      requireMember("profile");
      if (input.length > MAX_PACKAGES) throw new ApiError("invalid", "too_many_packages");
      const coach = findCoach(coachId);
      const keep = new Set(input.map((p) => p.id).filter(Boolean));
      for (const old of packagesOf(coachId)) if (!keep.has(old.id)) old.deleted_at = nowIso();
      input.forEach((p, order) => {
        const existing = p.id ? coachPackages.find((x) => x.id === p.id && x.coach_id === coachId) : undefined;
        const fields = { name: p.name, price_piasters: p.price_piasters, weeks: p.weeks, includes: p.includes, highlighted: p.highlighted, order };
        if (existing) Object.assign(existing, fields, { updated_at: nowIso() });
        else coachPackages.push({ ...fields, id: newId(), org_id: coach.org_id, coach_id: coachId, created_at: nowIso(), updated_at: nowIso(), deleted_at: null });
      });
      return packagesOf(coachId);
    }),
};

/** Accept = the client joins the coach list (created if the request came from a new person). */
function linkClient(request: (typeof coachRequests)[number]) {
  const stamp = { created_at: nowIso(), updated_at: nowIso(), deleted_at: null };
  let client = clients.find((c) => c.id === request.client_id);
  if (!client) {
    const profileId = newId();
    profiles.push({ ...stamp, id: profileId, role: "client", name: request.client_name, phone: null, email: null, avatar_url: null, language: "ar", time_zone: "Africa/Cairo" });
    client = { ...stamp, id: request.client_id, profile_id: profileId, status: "invited", goal: request.goal, target_weight_kg: null, target_date: null };
    clients.push(client);
  }
  const coach = coachProfiles.find((c) => c.id === request.coach_id)!;
  if (!coachClients.some((l) => l.client_id === client.id && l.coach_id === coach.id && !l.ended_at)) {
    coachClients.push({ ...stamp, id: newId(), org_id: coach.org_id, coach_id: coach.id, client_id: client.id, role: "trainer", status: "active", started_at: nowIso(), ended_at: null, assigned_member_id: null });
  }
}
