import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { GymRoute } from "./gym-route";

/** params is runtime data: unwrap it inside Suspense so the route can still prerender its shell. */
export default function Page({ params }: PageProps<"/[locale]/coach/clients/[id]/gym">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <GymRoute params={params} />
    </Suspense>
  );
}
