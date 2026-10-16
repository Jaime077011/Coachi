"use client";

import { InviteHelperForm } from "@/components/coach/invite-helper-form";
import { useBack } from "@/hooks/use-back";

export function InviteScreen() {
  return <InviteHelperForm back={useBack("/coach/team")} />;
}
