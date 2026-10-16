import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { DeclineRoute } from "./decline-route";

/** params is runtime data: unwrap it inside Suspense so the route can still prerender its shell. */
export default function Page({ params }: PageProps<"/[locale]/coach/requests/[id]/decline">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <DeclineRoute params={params} />
    </Suspense>
  );
}
