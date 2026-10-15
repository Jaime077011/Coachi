import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { WorkoutBuilder } from "./workout-builder";

/** Designed laptop-first: 3 panes. On phone, one day at a time. */
export default function Page({ params }: PageProps<"/[locale]/coach/plans/workout/[id]">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <WorkoutBuilder params={params} />
    </Suspense>
  );
}
