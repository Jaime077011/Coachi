"use client";

import { use } from "react";
import { AssignPlanScreen } from "@/components/coach/assign-plan-screen";

export function AssignRoute({ params }: { params: Promise<{ id: string }> }) {
  return <AssignPlanScreen kind="nutrition" id={use(params).id} />;
}
