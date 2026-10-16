"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/hooks/use-session";
import { roleHome } from "@/lib/roles";
import { BrandSplash } from "@/components/brand/brand-splash";

/** App entry (the installed app opens here): send each role to its own area, or to login when signed out. */
export default function EntryPage() {
  const router = useRouter();
  const { data: session, isSuccess } = useSession();

  useEffect(() => {
    if (!isSuccess) return;
    router.replace(session ? roleHome[session.profile.role] : "/login");
  }, [isSuccess, session, router]);

  return <BrandSplash />;
}
