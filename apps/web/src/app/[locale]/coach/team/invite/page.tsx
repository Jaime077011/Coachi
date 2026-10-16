import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { InviteScreen } from "./invite-screen";

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <InviteScreen />
    </Suspense>
  );
}
