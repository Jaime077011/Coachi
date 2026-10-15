"use client";

import type { TeamPermission } from "@coachi/validation";
import { LockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState, ListSkeleton } from "@/components/coachi/states";
import { Button } from "@/components/ui/button";
import { useCan } from "@/hooks/use-can";
import { useSession } from "@/hooks/use-session";
import { Link } from "@/i18n/navigation";

/** Wraps a coach screen a team role may not open, e.g. a helper following a link to Subscription. */
export function RequirePermission({ permission, children }: { permission: TeamPermission; children: React.ReactNode }) {
  const t = useTranslations("team");
  const session = useSession();
  const can = useCan();
  if (session.isPending) return <ListSkeleton />;
  if (!can(permission)) {
    return (
      <EmptyState
        icon={LockIcon}
        title={t("lockedTitle")}
        body={t("lockedBody")}
        action={
          <Button asChild variant="secondary">
            <Link href="/coach/today">{t("backToToday")}</Link>
          </Button>
        }
        className="mt-6"
      />
    );
  }
  return <>{children}</>;
}
