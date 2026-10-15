"use client";

import { api } from "@coachi/core";
import type { Locale } from "@coachi/i18n";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DownloadIcon, LogOutIcon, MessageCircleIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/coachi/screen-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useMe } from "@/hooks/use-session";
import { usePathname, useRouter } from "@/i18n/navigation";
import { initials } from "@/lib/initials";
import { qk } from "@/lib/query-keys";
import { whatsappUrl } from "@/lib/whatsapp";

/** Reminder switches live on the phone until notification_prefs is wired in Step 4. */
const PREFS_EVENT = "coachi:prefs";
function usePref(key: string, fallback: boolean) {
  const value = useSyncExternalStore(
    (cb) => {
      window.addEventListener(PREFS_EVENT, cb);
      return () => window.removeEventListener(PREFS_EVENT, cb);
    },
    () => {
      try {
        const v = localStorage.getItem(`coachi.pref.${key}`);
        return v === null ? fallback : v === "1";
      } catch {
        return fallback;
      }
    },
    () => fallback,
  );
  const set = (next: boolean) => {
    try {
      localStorage.setItem(`coachi.pref.${key}`, next ? "1" : "0");
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(PREFS_EVENT));
  };
  return [value, set] as const;
}

export function MeScreen() {
  const t = useTranslations("me");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { session, clientId } = useMe();
  const today = useQuery({ queryKey: qk.today(clientId), queryFn: () => api.journey.today(clientId), enabled: !!clientId });
  const [workoutReminder, setWorkoutReminder] = usePref("workoutReminder", true);
  const [mealReminder, setMealReminder] = usePref("mealReminder", false);
  const coach = today.data?.coach;

  return (
    <div className="flex flex-col gap-6">
      <ScreenHeader title={t("title")} />

      {session && (
        <Card>
          <CardContent className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="bg-secondary text-lg font-bold">{initials(session.profile.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">
                <bdi>{session.profile.name}</bdi>
              </p>
              {session.profile.phone && (
                <p className="text-sm text-muted-foreground" dir="ltr">
                  {session.profile.phone}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-5">
          <Row label={t("language")}>
            <ToggleGroup
              type="single"
              variant="outline"
              value={locale}
              onValueChange={(v) => v && router.replace(pathname, { locale: v as Locale })}
            >
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
          <Separator />
          <p className="text-sm text-muted-foreground">{t("units")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <p className="text-xs font-bold tracking-[0.12em] text-hint uppercase">{t("reminders")}</p>
          <SwitchRow id="r-workout" label={t("workoutReminder")} checked={workoutReminder} onChange={setWorkoutReminder} />
          <SwitchRow id="r-meal" label={t("mealReminder")} checked={mealReminder} onChange={setMealReminder} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {coach?.whatsapp && (
          <Button asChild variant="secondary" className="justify-start">
            <a href={whatsappUrl(coach.whatsapp)} target="_blank" rel="noreferrer">
              <MessageCircleIcon data-icon="inline-start" />
              {t("contactCoach")}
            </a>
          </Button>
        )}
        <Button variant="secondary" className="justify-start" onClick={() => toast(t("exportToast"))}>
          <DownloadIcon data-icon="inline-start" />
          {t("export")}
        </Button>
        <Button
          variant="ghost"
          className="justify-start text-destructive hover:text-destructive"
          onClick={() => {
            void api.auth.signOut();
            queryClient.clear();
            router.replace("/login");
          }}
        >
          <LogOutIcon data-icon="inline-start" className="rtl:rotate-180" />
          {t("logout")}
        </Button>
      </div>
    </div>
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

function SwitchRow({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <Label htmlFor={id} className="text-[15px] font-normal">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
