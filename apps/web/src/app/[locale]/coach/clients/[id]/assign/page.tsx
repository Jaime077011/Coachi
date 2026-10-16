import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { AssignScreen } from "./assign-screen";

export default function Page({ params }: PageProps<"/[locale]/coach/clients/[id]/assign">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <AssignScreen params={params} />
    </Suspense>
  );
}
