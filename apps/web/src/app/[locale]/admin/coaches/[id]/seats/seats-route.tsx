"use client";

import { use } from "react";
import { ChangeSeats } from "@/components/admin/coach-detail";

export function SeatsRoute({ params }: { params: Promise<{ id: string }> }) {
  return <ChangeSeats coachId={use(params).id} />;
}
