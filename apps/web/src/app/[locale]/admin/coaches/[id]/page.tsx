import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { CoachRoute } from "./coach-route";

export default function Page({ params }: PageProps<"/[locale]/admin/coaches/[id]">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <CoachRoute params={params} />
    </Suspense>
  );
}
