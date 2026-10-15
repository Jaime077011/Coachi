import type { SubscriptionStatus } from "@coachi/validation";
import type { Tone } from "@/components/coachi/status-chip";

/** Green = active, orange = ending soon, red = expired. Nothing else uses these. */
export const subscriptionTone: Record<SubscriptionStatus, Tone> = {
  trial: "info",
  active: "success",
  ending_soon: "warning",
  expired: "danger",
  paused: "neutral",
};
