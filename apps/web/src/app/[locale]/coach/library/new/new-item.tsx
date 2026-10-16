"use client";

import { useSearchParams } from "next/navigation";
import { useBack } from "@/hooks/use-back";
import { AddExerciseForm, AddFoodForm } from "../library-screen";

/** ?type=exercise|food */
export function NewLibraryItem({ base }: { base: string }) {
  const food = useSearchParams().get("type") === "food";
  const back = useBack(food ? `${base}?tab=foods` : base);
  return food ? <AddFoodForm back={back} /> : <AddExerciseForm back={back} />;
}
