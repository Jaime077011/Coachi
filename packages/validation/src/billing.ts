import { z } from "zod";
import { currency, date, id, orgScoped, piasters, storagePath, timestamp } from "./common";

/**
 * No plans: coaches buy seats ahead. A client seat per client, a team seat per helper (the owner
 * is free), each for one period. Every coach gets every feature; only the seat counts differ.
 * The super admin sets the prices (one row).
 */
export const seatPricing = z.object({
  client_seat_piasters: piasters,
  team_seat_piasters: piasters,
  currency,
  /** One paid period, e.g. 30 days. */
  period_days: z.number().int().min(1).max(366),
  /** New coaches: free for trial_days with trial_client_seats and no team seats. */
  trial_days: z.number().int().min(0).max(90),
  trial_client_seats: z.number().int().min(0).max(100),
});
export type SeatPricing = z.infer<typeof seatPricing>;

/** What the seats cost for one period. */
export const periodPrice = (p: Pick<SeatPricing, "client_seat_piasters" | "team_seat_piasters">, clientSeats: number, teamSeats: number) =>
  clientSeats * p.client_seat_piasters + teamSeats * p.team_seat_piasters;

export const subscriptionStatus = z.enum(["trial", "active", "ending_soon", "expired", "paused"]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatus>;

export const subscription = orgScoped.extend({
  /** Seats bought: clients he can have, and helpers (owner not counted). */
  client_seats: z.number().int().nonnegative(),
  team_seats: z.number().int().nonnegative(),
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
  /** What it paid for. */
  client_seats: z.number().int().nonnegative().nullable(),
  team_seats: z.number().int().nonnegative().nullable(),
  periods: z.number().int().positive().nullable(),
});
export type Payment = z.infer<typeof payment>;

/** Super admin "Record payment" form. Saving sets the seat counts and extends the end date by `periods`. */
export const recordPayment = z.object({
  org_id: id,
  client_seats: z.number().int().nonnegative(),
  team_seats: z.number().int().nonnegative(),
  periods: z.number().int().min(1).max(12),
  /** Worked out from the seats; the admin can change it (discounts, rounding). */
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
