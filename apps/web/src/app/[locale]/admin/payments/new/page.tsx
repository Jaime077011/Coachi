import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { NewPaymentScreen } from "./new-payment-screen";

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <NewPaymentScreen />
    </Suspense>
  );
}
