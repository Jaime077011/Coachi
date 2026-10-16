import type { CheckinsApi } from "./api";
import { DEMO, checkinForms, checkins, coachClients } from "../mock/data";
import { ApiError, mockRead, mockWrite, newId, nowIso } from "../mock/runtime";
import { requireMember } from "../mock/session";
import { clientProfileId, coachOfClient, nameOf, notify } from "../mock/notify";

const stamp = () => ({ created_at: nowIso(), updated_at: nowIso(), deleted_at: null });

const formOf = (coachId: string) => checkinForms.find((f) => f.coach_id === coachId) ?? null;

export const mockCheckins: CheckinsApi = {
  form: (coachId) => mockRead(() => formOf(coachId), null),

  saveForm: (coachId, input) =>
    mockWrite(() => {
      requireMember("checkin_form");
      const existing = formOf(coachId);
      if (existing) {
        Object.assign(existing, input, { updated_at: nowIso() });
        return existing;
      }
      const form = { ...input, ...stamp(), id: newId(), org_id: DEMO.orgId, coach_id: coachId };
      checkinForms.push(form);
      return form;
    }),

  formForClient: (clientId) =>
    mockRead(() => {
      const link = coachClients.find((l) => l.client_id === clientId && !l.ended_at);
      return link ? formOf(link.coach_id) : null;
    }, null),

  list: (clientId) =>
    mockRead(
      () => checkins.filter((c) => c.client_id === clientId).sort((a, b) => b.created_at.localeCompare(a.created_at)),
      [],
    ),

  submit: (clientId, input) =>
    mockWrite(() => {
      const link = coachClients.find((l) => l.client_id === clientId && !l.ended_at);
      const form = link ? formOf(link.coach_id) : null;
      if (!form) throw new ApiError("not_found");
      const checkin = { ...input, ...stamp(), id: newId(), client_id: clientId, form_id: form.id, coach_reply: null, read_at: null };
      checkins.push(checkin);
      notify(coachOfClient(clientId)?.profile_id, "checkin_new", { name: nameOf(clientProfileId(clientId)) }, `/coach/clients/${clientId}?tab=checkins`);
      return checkin;
    }),

  reply: (checkinId, text) =>
    mockWrite(() => {
      requireMember("checkins_reply");
      const checkin = checkins.find((c) => c.id === checkinId);
      if (!checkin) throw new ApiError("not_found");
      checkin.coach_reply = text;
      checkin.read_at ??= nowIso();
      notify(clientProfileId(checkin.client_id), "checkin_reply", { coach: coachOfClient(checkin.client_id)?.name ?? "" }, "/app/check-in");
      return checkin;
    }),

  markRead: (checkinId) =>
    mockWrite(() => {
      const checkin = checkins.find((c) => c.id === checkinId);
      if (checkin) checkin.read_at ??= nowIso();
    }),
};
