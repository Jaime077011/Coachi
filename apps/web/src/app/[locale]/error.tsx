"use client";

import { CircleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { StatusPage } from "@/components/coachi/status-page";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/** A screen crashed: say so, offer Try again. Step 3 sends the error to Sentry here. */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("errors");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <StatusPage icon={CircleAlertIcon} title={t("errorTitle")} body={t("errorBody")}>
      <Button size="lg" onClick={() => retry()}>
        {t("tryAgain")}
      </Button>
      <Button asChild size="lg" variant="secondary">
        <Link href="/start">{t("openApp")}</Link>
      </Button>
    </StatusPage>
  );
}
