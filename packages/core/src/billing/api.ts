import type {
  CoachSubscriptionView,
  FeatureKey,
  Payment,
  PlanFeature,
  PlanWithFeatures,
  RecordPayment,
  Subscription,
} from "@coachi/validation";

export interface BillingApi {
  plans(): Promise<PlanWithFeatures[]>;
  updatePlanFeature(planId: string, key: FeatureKey, value: PlanFeature["value"]): Promise<PlanWithFeatures>;
  /** The coach's own subscription screen. */
  mySubscription(orgId: string): Promise<CoachSubscriptionView>;
  payments(orgId: string): Promise<Payment[]>;
  /** Super admin. Saving extends the end date by the plan length. */
  recordPayment(input: RecordPayment): Promise<{ payment: Payment; subscription: Subscription }>;
  /** "Can this org do X?" — the one place feature checks live. */
  can(orgId: string, key: FeatureKey): Promise<boolean | number | null>;
}
