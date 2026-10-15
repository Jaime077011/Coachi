"use client";

import { api } from "@coachi/core";
import type { Locale } from "@coachi/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { LogOutIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useMe } from "@/hooks/use-session";
import { usePathname, useRouter } from "@/i18n/navigation";
import { initials } from "@/lib/initials";

/** Settings every role shares: who you are, language, theme, log out. Used by client Me and coach Settings. */
export function ProfileCard({ extra }: { extra?: React.ReactNode }) {
  const { session } = useMe();
  if (!session) return null;
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <Avatar className="size-14">
          {session.profile.avatar_url && <AvatarImage src={session.profile.avatar_url} alt="" />}
          <AvatarFallback className="bg-secondary text-lg font-bold">{initials(session.profile.name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-lg font-semibold">
            <bdi>{session.profile.name}</bdi>
          </p>
          {(session.profile.phone ?? session.profile.email) && (
            <p className="text-sm text-muted-foreground" dir="ltr">
              {session.profile.phone ?? session.profile.email}
            </p>
          )}
        </div>
        {extra}
      </CardContent>
    </Card>
  );
}

/** Language switch reloads into the new direction; theme is Dark, Light, or System. */
export function DisplaySettings({ footer }: { footer?: React.ReactNode }) {
  const t = useTranslations("me");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <Row label={t("language")}>
          <ToggleGroup type="single" variant="outline" value={locale} onValueChange={(v) => v && router.replace(pathname, { locale: v as Locale })}>
            <ToggleGroupItem value="ar" lang="ar" className="px-4">
              عربي
            </ToggleGroupItem>
            <ToggleGroupItem value="en" lang="en" className="px-4">
              English
            </ToggleGroupItem>
          </ToggleGroup>
        </Row>
        <Separator />
        <Row label={t("theme")}>
          <ToggleGroup type="single" variant="outline" value={theme ?? "dark"} onValueChange={(v) => v && setTheme(v)}>
            <ToggleGroupItem value="dark" className="px-3">
              {t("themeDark")}
            </ToggleGroupItem>
            <ToggleGroupItem value="light" className="px-3">
              {t("themeLight")}
            </ToggleGroupItem>
            <ToggleGroupItem value="system" className="px-3">
              {t("themeSystem")}
            </ToggleGroupItem>
          </ToggleGroup>
        </Row>
        {footer && (
          <>
            <Separator />
            {footer}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return () => {
    void api.auth.signOut();
    queryClient.clear();
    router.replace("/login");
  };
}

export function SignOutButton() {
  const t = useTranslations("me");
  const signOut = useSignOut();
  return (
    <Button variant="ghost" className="justify-start text-destructive hover:text-destructive" onClick={signOut}>
      <LogOutIcon data-icon="inline-start" className="rtl:rotate-180" />
      {t("logout")}
    </Button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="font-semibold">{label}</span>
      {children}
    </div>
  );
}
