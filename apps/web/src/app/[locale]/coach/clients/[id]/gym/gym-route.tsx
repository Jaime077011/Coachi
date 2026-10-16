"use client";

import { use } from "react";
import { EditClientGym } from "../tabs/file-tab";

export function GymRoute({ params }: { params: Promise<{ id: string }> }) {
  return <EditClientGym clientId={use(params).id} />;
}
