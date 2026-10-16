import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { NewLibraryItem } from "./new-item";

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <NewLibraryItem base="/coach/library" />
    </Suspense>
  );
}
