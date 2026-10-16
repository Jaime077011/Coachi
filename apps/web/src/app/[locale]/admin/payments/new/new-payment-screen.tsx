"use client";

import { useSearchParams } from "next/navigation";
import { RecordPaymentForm } from "@/components/admin/record-payment-form";
import { useBack } from "@/hooks/use-back";

/** ?org= preselects the coach (from the coach's page). */
export function NewPaymentScreen() {
  const org = useSearchParams().get("org");
  return <RecordPaymentForm key={org ?? "any"} back={useBack("/admin/overview")} orgId={org} />;
}
