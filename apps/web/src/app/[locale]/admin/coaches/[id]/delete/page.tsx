import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { DeleteRoute } from "./delete-route";

export default function Page({ params }: PageProps<"/[locale]/admin/coaches/[id]/delete">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <DeleteRoute params={params} />
    </Suspense>
  );
}
