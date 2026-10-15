import { Suspense } from "react";
import { ListSkeleton } from "@/components/coachi/states";
import { NutritionBuilder } from "./nutrition-builder";

export default function Page({ params }: PageProps<"/[locale]/coach/plans/nutrition/[id]">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <NutritionBuilder params={params} />
    </Suspense>
  );
}
