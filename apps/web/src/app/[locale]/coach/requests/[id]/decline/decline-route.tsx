"use client";

import { use } from "react";
import { DeclineRequest } from "../../requests-screen";

export function DeclineRoute({ params }: { params: Promise<{ id: string }> }) {
  return <DeclineRequest requestId={use(params).id} />;
}
