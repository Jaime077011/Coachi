import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { CoachPageScreen } from "./coach-page-screen";

export default function Page({ params }: PageProps<"/[locale]/app/coaches/[id]">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <CoachPageScreen params={params} />
    </Suspense>
  );
}
