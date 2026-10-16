import { periodPrice } from "@coachi/validation";
import type { BillingApi } from "./api";
import { coachClients, payments, seatPricing, subscriptions } from "../mock/data";
import { activeMembers } from "../mock/session";
import { ApiError, mockRead, mockWrite, newId, nowIso } from "../mock/runtime";

const DAY = 86_400_000;

const subOf = (orgId: string) => {
  const sub = subscriptions.find((s) => s.org_id === orgId);
  if (!sub) throw new ApiError("not_found");
  return sub;
};

const pricing = () => seatPricing[0]!;

export const mockBilling: BillingApi = {
  pricing: () => mockRead(pricing),

  savePricing: (input) =>
    mockWrite(() => {
      Object.assign(pricing(), input);
      return pricing();
    }),

  mySubscription: (orgId) =>
    mockRead(() => {
      const subscription = subOf(orgId);
      return {
        subscription,
        pricing: pricing(),
        client_count: coachClients.filter((l) => l.org_id === orgId && !l.ended_at).length,
        team_count: activeMembers(orgId).filter((m) => m.role !== "owner").length,
        period_piasters: periodPrice(pricing(), subscription.client_seats, subscription.team_seats),
        days_left: Math.ceil((Date.parse(subscription.ends_at) - Date.now()) / DAY),
      };
    }),

  payments: (orgId) =>
    mockRead(() => payments.filter((p) => p.org_id === orgId).sort((a, b) => b.paid_at.localeCompare(a.paid_at)), []),

  recordPayment: (input) =>
    mockWrite(() => {
      const subscription = subOf(input.org_id);
      const payment = {
        id: newId(),
        org_id: input.org_id,
        amount_piasters: input.amount_piasters,
        currency: "EGP" as const,
        method: input.method,
        paid_at: new Date(`${input.paid_on}T12:00:00`).toISOString(),
        note: input.note ?? null,
        receipt_path: input.receipt_path ?? null,
        client_seats: input.client_seats,
        team_seats: input.team_seats,
        periods: input.periods,
        created_at: nowIso(),
        updated_at: nowIso(),
        deleted_at: null,
      };
      payments.push(payment);
      // The seats he paid for, from now on. Extend from the later of today or the current end date.
      const from = Math.max(Date.now(), Date.parse(subscription.ends_at));
      Object.assign(subscription, {
        client_seats: input.client_seats,
        team_seats: input.team_seats,
        ends_at: new Date(from + input.periods * pricing().period_days * DAY).toISOString(),
        status: "active",
        updated_at: nowIso(),
      });
      return { payment, subscription };
    }),
};
