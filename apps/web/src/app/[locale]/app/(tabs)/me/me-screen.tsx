"use client";

import { api } from "@coachi/core";
import { useQuery } from "@tanstack/react-query";
import { ChevronRightIcon, DumbbellIcon, MessageCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ExportMyDataButton } from "@/components/coachi/export-buttons";
import { IconTile } from "@/components/coachi/icon-tile";
import { ReminderSettings } from "@/components/coachi/reminder-settings";
import { ScreenHeader } from "@/components/coachi/screen-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DisplaySettings, ProfileCard, SignOutButton } from "@/components/shell/account-settings";
import { useMe } from "@/hooks/use-session";
import { Link } from "@/i18n/navigation";
import { qk } from "@/lib/query-keys";
import { whatsappUrl } from "@/lib/whatsapp";

export function MeScreen() {
  const t = useTranslations("me");
  const { clientId } = useMe();
  const today = useQuery({ queryKey: qk.today(clientId), queryFn: () => api.journey.today(clientId), enabled: !!clientId });
  const coach = today.data?.coach;

  return (
    <div className="flex flex-col gap-6">
      <ScreenHeader title={t("title")} />

      <ProfileCard />

      <GymLink clientId={clientId} />

      <DisplaySettings footer={<p className="text-sm text-muted-foreground">{t("units")}</p>} />

      <ReminderSettings title={t("reminders")} keys={["workout_reminder", "meal_reminder", "checkin_reminder"]} />

      <div className="flex flex-col gap-2">
        {coach?.whatsapp && (
          <Button asChild variant="secondary" className="justify-start">
            <a href={whatsappUrl(coach.whatsapp)} target="_blank" rel="noreferrer">
              <MessageCircleIcon data-icon="inline-start" />
              {t("contactCoach")}
            </a>
          </Button>
        )}
        <ExportMyDataButton />
        <SignOutButton />
      </div>
    </div>
  );
}

/** Shortcut to My gym, with how much he has listed so far. */
function GymLink({ clientId }: { clientId: string }) {
  const t = useTranslations("gym");
  const gym = useQuery({ queryKey: qk.clientGym(clientId), queryFn: () => api.clients.gym(clientId), enabled: !!clientId });
  const count = gym.data ? gym.data.items.length + gym.data.custom_items.length : 0;
  return (
    <Link href="/app/me/gym" className="block rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="flex items-center gap-3">
          <IconTile icon={DumbbellIcon} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t("meLink")}</p>
            <p className="text-sm text-muted-foreground">{gym.isSuccess ? t("count", { n: count }) : t("meLinkHint")}</p>
          </div>
          <ChevronRightIcon className="size-5 text-hint rtl:rotate-180" aria-hidden />
        </CardContent>
      </Card>
    </Link>
  );
}
