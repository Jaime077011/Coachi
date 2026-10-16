"use client";

import { use } from "react";
import { CoachDetail } from "@/components/admin/coach-detail";

export function CoachRoute({ params }: { params: Promise<{ id: string }> }) {
  return <CoachDetail coachId={use(params).id} />;
}
