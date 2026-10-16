import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { SeatsRoute } from "./seats-route";

export default function Page({ params }: PageProps<"/[locale]/admin/coaches/[id]/seats">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <SeatsRoute params={params} />
    </Suspense>
  );
}
