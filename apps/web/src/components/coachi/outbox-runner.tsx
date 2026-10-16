"use client";

import { useEffect } from "react";
import { startOutbox } from "@/lib/outbox";

/** Sends workout sets saved offline as soon as the client app is open and online. */
export function OutboxRunner() {
  useEffect(() => startOutbox(), []);
  return null;
}
