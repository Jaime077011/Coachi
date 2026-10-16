"use client";

import { use } from "react";
import { RemoveMember } from "../../team-screen";

export function RemoveRoute({ params }: { params: Promise<{ memberId: string }> }) {
  return <RemoveMember memberId={use(params).memberId} />;
}
