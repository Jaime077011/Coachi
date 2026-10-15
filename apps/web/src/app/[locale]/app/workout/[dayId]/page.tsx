import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { WorkoutScreen } from "./workout-screen";

/** Workout mode: full screen, no tab bar (outside the (tabs) group). */
export default function Page({ params }: PageProps<"/[locale]/app/workout/[dayId]">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col overscroll-none">
      <Suspense fallback={<ListSkeleton className="p-4" />}>
        <WorkoutScreen params={params} />
      </Suspense>
    </main>
  );
}
