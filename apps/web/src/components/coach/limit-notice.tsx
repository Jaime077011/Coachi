"use client";

import { MessageCircleIcon, TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { whatsappUrl } from "@/lib/whatsapp";

/** Support WhatsApp for renewals. Moves to admin Settings data in Step 4. */
export const SUPPORT_WHATSAPP = "+201000000001";

/** Clear note when the coach hits his plan's client limit, with renew on WhatsApp. */
export function LimitNotice() {
  const t = useTranslations("clients");
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/12 p-4">
      <p className="flex items-center gap-2 font-semibold text-warning">
        <TriangleAlertIcon className="size-5 shrink-0" aria-hidden />
        {t("limitTitle")}
      </p>
      <p className="text-sm">{t("limitBody")}</p>
      <Button asChild variant="secondary" className="w-fit">
        <a href={whatsappUrl(SUPPORT_WHATSAPP)} target="_blank" rel="noreferrer">
          <MessageCircleIcon data-icon="inline-start" />
          {t("renew")}
        </a>
      </Button>
    </div>
  );
}
