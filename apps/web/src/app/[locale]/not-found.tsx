import { CompassIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { StatusPage } from "@/components/coachi/status-page";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("errors");
  return (
    <StatusPage icon={CompassIcon} title={t("notFoundTitle")} body={t("notFoundBody")}>
      <Button asChild size="lg">
        <Link href="/start">{t("openApp")}</Link>
      </Button>
      <Button asChild size="lg" variant="secondary">
        <Link href="/">{t("homePage")}</Link>
      </Button>
    </StatusPage>
  );
}
