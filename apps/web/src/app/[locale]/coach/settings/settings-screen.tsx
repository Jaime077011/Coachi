"use client";

import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/coachi/screen-header";
import { StatusChip } from "@/components/coachi/status-chip";
import { DisplaySettings, ProfileCard, SignOutButton } from "@/components/shell/account-settings";
import { Button } from "@/components/ui/button";
import { useCan } from "@/hooks/use-can";
import { useMe } from "@/hooks/use-session";

/** Coach and team: who you are, language, theme, export, log out. Every team role can open it. */
export function CoachSettingsScreen() {
  const t = useTranslations("coachSettings");
  const tTeam = useTranslations("team");
  const { session } = useMe();
  const can = useCan();
  const role = session?.member_role;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <ScreenHeader title={t("title")} className="mb-0" />
      <ProfileCard extra={role && <StatusChip tone={role === "owner" ? "success" : "info"}>{tTeam(`role_${role}`)}</StatusChip>} />
      <DisplaySettings />
      <div className="flex flex-col gap-2">
        {can("clients_all") && (
          // Real export (CSV of every client file and log) comes with the backend in Step 4.
          <Button variant="secondary" className="justify-start" onClick={() => toast(t("exportToast"))}>
            <DownloadIcon data-icon="inline-start" />
            {t("export")}
          </Button>
        )}
        <SignOutButton />
      </div>
    </div>
  );
}
