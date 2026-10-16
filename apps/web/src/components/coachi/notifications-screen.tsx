"use client";

import { useTranslations } from "next-intl";
import { NotificationsList } from "@/components/coachi/notifications";
import { ScreenHeader } from "@/components/coachi/screen-header";

export function NotificationsScreen({ back }: { back: string }) {
  const t = useTranslations("notifications");
  return (
    <div className="flex max-w-2xl flex-col">
      <ScreenHeader title={t("title")} back={back} />
      <NotificationsList />
    </div>
  );
}
