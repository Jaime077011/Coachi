import { Suspense } from "react";
import { RequirePermission } from "@/components/coach/require-permission";
import { ListSkeleton } from "@/components/coachi/states";
import { NutritionBuilder } from "./nutrition-builder";

export default function Page({ params }: PageProps<"/[locale]/coach/plans/nutrition/[id]">) {
  return (
    <RequirePermission permission="plans_edit">
      <Suspense fallback={<ListSkeleton />}>
        <NutritionBuilder params={params} />
      </Suspense>
    </RequirePermission>
  );
}
