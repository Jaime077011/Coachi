import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { NewClientScreen } from "./new-client-screen";

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <NewClientScreen />
    </Suspense>
  );
}
