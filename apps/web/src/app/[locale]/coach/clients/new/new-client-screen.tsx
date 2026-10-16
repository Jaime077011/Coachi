"use client";

import { AddClientForm } from "@/components/coach/add-client-form";
import { useBack } from "@/hooks/use-back";

export function NewClientScreen() {
  return <AddClientForm back={useBack("/coach/clients")} />;
}
