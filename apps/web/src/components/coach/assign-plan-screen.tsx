"use client";

import { api } from "@coachi/core";
import { useQuery } from "@tanstack/react-query";
import { QueryState } from "@/components/coachi/query-state";
import { useBack } from "@/hooks/use-back";
import { useRouter } from "@/i18n/navigation";
import { AssignToClientsForm, type PlanKind } from "./assign-forms";

/** /coach/plans/<kind>/<id>/assign: loads the template's name, then the client picker. */
export function AssignPlanScreen({ kind, id }: { kind: PlanKind; id: string }) {
  const router = useRouter();
  const back = useBack("/coach/plans");
  // Its own key: the builders cache the full plan under qk.program / qk.nutritionPlan.
  const plan = useQuery({
    queryKey: ["plan-name", kind, id],
    queryFn: async () =>
      kind === "workout" ? { id, name: (await api.training.getProgram(id)).program.name } : { id, name: (await api.nutrition.getPlan(id)).plan.name },
  });
  return <QueryState query={plan}>{(p) => <AssignToClientsForm kind={kind} plan={p} back={back} onDone={() => router.push(back)} />}</QueryState>;
}
