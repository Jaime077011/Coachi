import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { LibraryScreen } from "./library-screen";

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <LibraryScreen />
    </Suspense>
  );
}
