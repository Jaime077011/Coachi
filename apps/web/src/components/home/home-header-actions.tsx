"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { Link, usePathname } from "@/i18n/navigation";
import { roleHome } from "@/lib/roles";

/** Language switch, and Log in (or Open the app when already signed in). */
export function HomeHeaderActions() {
  const t = useTranslations("home");
  const locale = useLocale();
  const pathname = usePathname();
  const session = useSession();
  const other = locale === "ar" ? "en" : "ar";

  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="ghost" size="sm">
        <Link href={pathname} locale={other} lang={other}>
          {other === "ar" ? "عربي" : "English"}
        </Link>
      </Button>
      {session.data ? (
        <Button asChild size="sm">
          <Link href={roleHome[session.data.profile.role]}>{t("openApp")}</Link>
        </Button>
      ) : (
        <Button asChild size="sm" variant="secondary">
          <Link href="/login">{t("login")}</Link>
        </Button>
      )}
    </div>
  );
}
