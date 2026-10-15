"use client";

import { api } from "@coachi/core";
import { useQuery } from "@tanstack/react-query";
import { LockIcon, MessageCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useCan } from "@/hooks/use-can";
import { useMe } from "@/hooks/use-session";
import { qk } from "@/lib/query-keys";
import { whatsappUrl } from "@/lib/whatsapp";
import { SUPPORT_WHATSAPP } from "./limit-notice";

/**
 * Ended or paused subscription: one calm bar on every coach screen. Everything stays visible;
 * adding clients, helpers, and new plans is blocked until the owner renews.
 */
export function ReadOnlyBanner() {
  const t = useTranslations("readOnly");
  const { orgId } = useMe();
  const can = useCan();
  const sub = useQuery({ queryKey: qk.subscription(orgId), queryFn: () => api.billing.mySubscription(orgId), enabled: !!orgId });
  const status = sub.data?.subscription.status;
  if (status !== "expired" && status !== "paused") return null;

  return (
    <div role="status" className="flex flex-wrap items-center gap-3 border-b border-destructive/40 bg-destructive/12 px-4 py-2.5 text-sm text-destructive lg:px-6">
      <LockIcon className="size-4 shrink-0" aria-hidden />
      <span className="flex-1 font-semibold">
        {status === "paused" ? t("paused") : t("expired")} {can("subscription") ? null : t("askOwner")}
      </span>
      {can("subscription") && (
        <Button asChild size="sm" variant="secondary">
          <a href={whatsappUrl(SUPPORT_WHATSAPP, t("renewMessage"))} target="_blank" rel="noreferrer">
            <MessageCircleIcon data-icon="inline-start" />
            {t("renew")}
          </a>
        </Button>
      )}
    </div>
  );
}
