import type { CoachCard } from "@coachi/validation";
import type { DirectoryApi } from "./api";
import { DEMO, clients, coachClients, coachProfiles, coachRequests, coachResults, profiles } from "../mock/data";
import { ApiError, getMockRole, mockRead, mockWrite, newId, nowIso } from "../mock/runtime";

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
      results: coachResults.filter((r) => r.coach_id === coachId),
      my_request:
        coachRequests.find((r) => r.coach_id === coachId && r.client_id === browsingClientId()) ?? null,
    })),

  sendRequest: (input) =>
    mockWrite(() => {
      const clientId = browsingClientId();
      const client = clients.find((c) => c.id === clientId)!;
      const request = {
        ...input,
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
      return request;
    }),

  myRequests: () => mockRead(() => coachRequests.filter((r) => r.client_id === browsingClientId()), []),

  inbox: (coachId) =>
    mockRead(
      () =>
        coachRequests
          .filter((r) => r.coach_id === coachId)
          .sort((a, b) => b.created_at.localeCompare(a.created_at)),
      [],
    ),

  answer: (requestId, accept, reply) =>
    mockWrite(() => {
      const request = coachRequests.find((r) => r.id === requestId);
      if (!request) throw new ApiError("not_found");
      request.status = accept ? "accepted" : "declined";
      request.reply = reply ?? null;
      request.updated_at = nowIso();
      if (accept) linkClient(request);
      return request;
    }),

  myProfile: (coachId) => mockRead(() => findCoach(coachId)),

  updateProfile: (coachId, patch) =>
    mockWrite(() => {
      const coach = findCoach(coachId);
      Object.assign(coach, patch, { updated_at: nowIso() });
      return coach;
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
    coachClients.push({ ...stamp, id: newId(), org_id: coach.org_id, coach_id: coach.id, client_id: client.id, role: "trainer", status: "active", started_at: nowIso(), ended_at: null });
  }
}
