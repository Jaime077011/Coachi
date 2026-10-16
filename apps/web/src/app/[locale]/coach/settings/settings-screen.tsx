"use client";

import { useTranslations } from "next-intl";
import { ExportClientsButton } from "@/components/coachi/export-buttons";
import { ReminderSettings } from "@/components/coachi/reminder-settings";
import { ScreenHeader } from "@/components/coachi/screen-header";
import { StatusChip } from "@/components/coachi/status-chip";
import { DisplaySettings, ProfileCard, SignOutButton } from "@/components/shell/account-settings";
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
    <div className="flex flex-col gap-6">
      <ScreenHeader title={t("title")} className="mb-0" />
      <ProfileCard extra={role && <StatusChip tone={role === "owner" ? "success" : "info"}>{tTeam(`role_${role}`)}</StatusChip>} />
      <DisplaySettings />
      <ReminderSettings title={t("alerts")} keys={["request_new", "checkin_new", "workout_done"]} />
      <div className="flex flex-col gap-2">
        {can("clients_all") && (
          <ExportClientsButton />
        )}
        <SignOutButton />
      </div>
    </div>
  );
}
