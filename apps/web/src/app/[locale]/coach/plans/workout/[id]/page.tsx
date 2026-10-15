import { Suspense } from "react";
import { RequirePermission } from "@/components/coach/require-permission";
import { ListSkeleton } from "@/components/coachi/states";
import { WorkoutBuilder } from "./workout-builder";

/** Designed laptop-first: 3 panes. On phone, one day at a time. */
export default function Page({ params }: PageProps<"/[locale]/coach/plans/workout/[id]">) {
  return (
    <RequirePermission permission="plans_edit">
      <Suspense fallback={<ListSkeleton />}>
        <WorkoutBuilder params={params} />
      </Suspense>
    </RequirePermission>
  );
}
