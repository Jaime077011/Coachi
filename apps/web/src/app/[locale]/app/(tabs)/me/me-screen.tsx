"use client";

import { api } from "@coachi/core";
import { useQuery } from "@tanstack/react-query";
import { DownloadIcon, MessageCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/coachi/screen-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DisplaySettings, ProfileCard, SignOutButton } from "@/components/shell/account-settings";
import { useMe } from "@/hooks/use-session";
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
  const { clientId } = useMe();
  const today = useQuery({ queryKey: qk.today(clientId), queryFn: () => api.journey.today(clientId), enabled: !!clientId });
  const [workoutReminder, setWorkoutReminder] = usePref("workoutReminder", true);
  const [mealReminder, setMealReminder] = usePref("mealReminder", false);
  const coach = today.data?.coach;

  return (
    <div className="flex flex-col gap-6">
      <ScreenHeader title={t("title")} />

      <ProfileCard />

      <DisplaySettings footer={<p className="text-sm text-muted-foreground">{t("units")}</p>} />

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
        <SignOutButton />
      </div>
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
