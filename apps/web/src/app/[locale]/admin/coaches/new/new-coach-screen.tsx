"use client";

import { api } from "@coachi/core";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { AddCoachForm } from "@/components/admin/add-coach-form";
import { useBack } from "@/hooks/use-back";
import { qk } from "@/lib/query-keys";

/** ?name=&phone=&lead= when it comes from a coach request on the Overview. */
export function NewCoachScreen() {
  const search = useSearchParams();
  const queryClient = useQueryClient();
  const back = useBack("/admin/coaches");
  const lead = search.get("lead");
  const name = search.get("name");
  const phone = search.get("phone");
  return (
    <AddCoachForm
      back={back}
      initial={name || phone ? { name: name ?? "", phone: phone ?? "" } : undefined}
      onAdded={
        lead
          ? () => void api.admin.setLeadStatus(lead, "added").then(() => queryClient.invalidateQueries({ queryKey: qk.coachLeads }))
          : undefined
      }
    />
  );
}
