import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { NewLibraryItem } from "@/app/[locale]/coach/library/new/new-item";

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <NewLibraryItem base="/admin/libraries" />
    </Suspense>
  );
}
