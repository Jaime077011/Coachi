import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { AssignRoute } from "./assign-route";

export default function Page({ params }: PageProps<"/[locale]/coach/plans/workout/[id]/assign">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <AssignRoute params={params} />
    </Suspense>
  );
}
