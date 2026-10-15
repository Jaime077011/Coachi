import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { JoinScreen } from "./join-screen";

export default function JoinPage({ params }: PageProps<"/[locale]/join/[code]">) {
  return (
    <Suspense fallback={<ListSkeleton rows={2} />}>
      <JoinScreen params={params} />
    </Suspense>
  );
}
