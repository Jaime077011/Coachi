"use client";

import { use } from "react";
import { DeleteCoach } from "@/components/admin/coach-detail";

export function DeleteRoute({ params }: { params: Promise<{ id: string }> }) {
  return <DeleteCoach coachId={use(params).id} />;
}
