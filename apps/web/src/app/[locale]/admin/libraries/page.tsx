import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { LibraryScreen } from "@/app/[locale]/coach/library/library-screen";

/** Shared exercises and foods, bilingual names, video links. Same screen as the coach library. */
export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <LibraryScreen admin />
    </Suspense>
  );
}
