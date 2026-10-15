import { z } from "zod";
import { base, currency, date, id, orgScoped, piasters, storagePath, timestamp } from "./common";

export const plan = base.extend({
  name: z.string().min(1).max(40),
  price_piasters: piasters,
  currency,
  days: z.number().int().positive(),
});
export type Plan = z.infer<typeof plan>;

/** Plans give features, not fixed limits. Code asks "can this org do X?" in one place. */
export const featureKey = z.enum([
  "client_limit",
  /** Helpers on the coach's team, owner not counted. */
  "team_seats",
  "nutrition",
  "directory_listing",
  "ai_credits",
  "branded_app",
]);
export type FeatureKey = z.infer<typeof featureKey>;

export const planFeature = base.extend({
  plan_id: id,
  key: featureKey,
  /** Numbers for limits (null = unlimited), booleans for on/off features. */
  value: z.union([z.number().int().nonnegative(), z.boolean(), z.null()]),
});
export type PlanFeature = z.infer<typeof planFeature>;

export const subscriptionStatus = z.enum(["trial", "active", "ending_soon", "expired", "paused"]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatus>;

export const subscription = orgScoped.extend({
  plan_id: id,
  status: subscriptionStatus,
  starts_at: timestamp,
  ends_at: timestamp,
  source: z.enum(["manual", "paymob"]),
});
export type Subscription = z.infer<typeof subscription>;

export const paymentMethod = z.enum(["instapay", "cash", "bank", "vodafone_cash"]);
export type PaymentMethod = z.infer<typeof paymentMethod>;

export const payment = orgScoped.extend({
  amount_piasters: piasters,
  currency,
  method: paymentMethod,
  paid_at: timestamp,
  note: z.string().max(500).nullable(),
  receipt_path: storagePath.nullable(),
});
export type Payment = z.infer<typeof payment>;

/** Super admin "Record payment" form. Saving it extends the end date. */
export const recordPayment = z.object({
  org_id: id,
  amount_piasters: piasters.positive(),
  method: paymentMethod,
  paid_on: date,
  note: z.string().max(500).optional(),
  receipt_path: storagePath.optional(),
});
export type RecordPayment = z.infer<typeof recordPayment>;

export const featureFlag = orgScoped.extend({
  key: z.string().min(1),
  on: z.boolean(),
});
export type FeatureFlag = z.infer<typeof featureFlag>;
