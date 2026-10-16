"use client";

import { use } from "react";
import { AssignTemplateForm } from "@/components/coach/assign-forms";
import { useBack } from "@/hooks/use-back";
import { useRouter } from "@/i18n/navigation";

export function AssignScreen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const back = useBack(`/coach/clients/${id}?tab=plans`);
  return <AssignTemplateForm clientId={id} back={back} onDone={() => router.push(back)} />;
}
