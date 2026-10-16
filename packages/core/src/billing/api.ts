import type { CoachSubscriptionView, Payment, RecordPayment, SeatPricing, Subscription } from "@coachi/validation";

export interface BillingApi {
  /** Public: the home page shows these. */
  pricing(): Promise<SeatPricing>;
  /** Super admin. */
  savePricing(input: SeatPricing): Promise<SeatPricing>;
  /** The coach's own subscription screen. */
  mySubscription(orgId: string): Promise<CoachSubscriptionView>;
  payments(orgId: string): Promise<Payment[]>;
  /** Super admin. Sets the seat counts and extends the end date by periods × period_days. */
  recordPayment(input: RecordPayment): Promise<{ payment: Payment; subscription: Subscription }>;
}
