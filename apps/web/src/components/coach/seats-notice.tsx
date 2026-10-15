"use client";

import { MessageCircleIcon, TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { whatsappUrl } from "@/lib/whatsapp";
import { SUPPORT_WHATSAPP } from "./limit-notice";

/** The plan has no team seats, or they're all taken: say so, with upgrade on WhatsApp. */
export function SeatsNotice({ full }: { full: boolean }) {
  const t = useTranslations("team");
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/12 p-4">
      <p className="flex items-center gap-2 font-semibold text-warning">
        <TriangleAlertIcon className="size-5 shrink-0" aria-hidden />
        {full ? t("seatsFullTitle") : t("noSeatsTitle")}
      </p>
      <p className="text-sm">{full ? t("seatsFullBody") : t("noSeatsBody")}</p>
      <Button asChild variant="secondary" className="w-fit">
        <a href={whatsappUrl(SUPPORT_WHATSAPP, t("upgradeMessage"))} target="_blank" rel="noreferrer">
          <MessageCircleIcon data-icon="inline-start" />
          {t("upgrade")}
        </a>
      </Button>
    </div>
  );
}
