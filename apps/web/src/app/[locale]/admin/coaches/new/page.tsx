import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { NewCoachScreen } from "./new-coach-screen";

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <NewCoachScreen />
    </Suspense>
  );
}
