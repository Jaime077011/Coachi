import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { RemoveRoute } from "./remove-route";

/** params is runtime data: unwrap it inside Suspense so the route can still prerender its shell. */
export default function Page({ params }: PageProps<"/[locale]/coach/team/[memberId]/remove">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <RemoveRoute params={params} />
    </Suspense>
  );
}
