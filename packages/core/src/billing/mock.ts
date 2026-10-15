import type { BillingApi } from "./api";
import { coachClients, payments, planFeatures, plans, subscriptions } from "../mock/data";
import { activeMembers } from "../mock/session";
import { ApiError, mockRead, mockWrite, newId, nowIso } from "../mock/runtime";

const DAY = 86_400_000;

const subOf = (orgId: string) => {
  const sub = subscriptions.find((s) => s.org_id === orgId);
  if (!sub) throw new ApiError("not_found");
  return sub;
};

const featureValue = (planId: string, key: string) =>
  planFeatures.find((f) => f.plan_id === planId && f.key === key)?.value ?? null;

const withFeatures = (planId: string) => ({
  plan: plans.find((p) => p.id === planId)!,
  features: planFeatures.filter((f) => f.plan_id === planId),
  coaches_on_plan: subscriptions.filter((s) => s.plan_id === planId && s.status !== "expired").length,
});

export const mockBilling: BillingApi = {
  plans: () => mockRead(() => plans.map((p) => withFeatures(p.id)), []),

  updatePlanFeature: (planId, key, value) =>
    mockWrite(() => {
      const feature = planFeatures.find((f) => f.plan_id === planId && f.key === key);
      if (feature) Object.assign(feature, { value, updated_at: nowIso() });
      else
        planFeatures.push({ id: newId(), plan_id: planId, key, value, created_at: nowIso(), updated_at: nowIso(), deleted_at: null });
      return withFeatures(planId);
    }),

  mySubscription: (orgId) =>
    mockRead(() => {
      const subscription = subOf(orgId);
      const limit = featureValue(subscription.plan_id, "client_limit");
      return {
        subscription,
        plan: plans.find((p) => p.id === subscription.plan_id)!,
        client_limit: typeof limit === "number" ? limit : null,
        client_count: coachClients.filter((l) => l.org_id === orgId && !l.ended_at).length,
        team_seats: (() => {
          const seats = featureValue(subscription.plan_id, "team_seats");
          return typeof seats === "number" ? seats : null;
        })(),
        team_count: activeMembers(orgId).filter((m) => m.role !== "owner").length,
        days_left: Math.ceil((Date.parse(subscription.ends_at) - Date.now()) / DAY),
      };
    }),

  payments: (orgId) =>
    mockRead(() => payments.filter((p) => p.org_id === orgId).sort((a, b) => b.paid_at.localeCompare(a.paid_at)), []),

  recordPayment: (input) =>
    mockWrite(() => {
      const subscription = subOf(input.org_id);
      const plan = plans.find((p) => p.id === subscription.plan_id)!;
      const payment = {
        id: newId(),
        org_id: input.org_id,
        amount_piasters: input.amount_piasters,
        currency: "EGP" as const,
        method: input.method,
        paid_at: new Date(`${input.paid_on}T12:00:00`).toISOString(),
        note: input.note ?? null,
        receipt_path: input.receipt_path ?? null,
        created_at: nowIso(),
        updated_at: nowIso(),
        deleted_at: null,
      };
      payments.push(payment);
      // Extend from the later of today or the current end date.
      const from = Math.max(Date.now(), Date.parse(subscription.ends_at));
      subscription.ends_at = new Date(from + plan.days * DAY).toISOString();
      subscription.status = "active";
      subscription.updated_at = nowIso();
      return { payment, subscription };
    }),

  can: (orgId, key) =>
    mockRead(() => {
      const sub = subOf(orgId);
      if (sub.status === "expired" || sub.status === "paused") return false;
      return featureValue(sub.plan_id, key);
    }),
};
