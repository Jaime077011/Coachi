import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { ClientFileScreen } from "./client-file-screen";

export default function Page({ params }: PageProps<"/[locale]/coach/clients/[id]">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <ClientFileScreen params={params} />
    </Suspense>
  );
}
