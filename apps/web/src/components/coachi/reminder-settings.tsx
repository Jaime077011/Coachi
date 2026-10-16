"use client";

import { api } from "@coachi/core";
import type { NotificationPref, PrefKey } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useMe } from "@/hooks/use-session";
import { useApiErrorToast } from "@/lib/api-error";
import { qk } from "@/lib/query-keys";

/**
 * Reminders (client: workout, meals, check-in, each with a time) or alerts (coach: on/off).
 * Saved per person now; push delivery uses them once the jobs worker is in (Step 4).
 */
export function ReminderSettings({ title, keys, hint }: { title: string; keys: PrefKey[]; hint?: string }) {
  const t = useTranslations("notifications");
  const { session } = useMe();
  const queryClient = useQueryClient();
  const showError = useApiErrorToast();
  const prefs = useQuery({ queryKey: qk.prefs, queryFn: () => api.notifications.prefs(), enabled: !!session });

  const save = useMutation({
    mutationFn: ({ type, on, time }: { type: PrefKey; on: boolean; time: string | null }) => api.notifications.savePref(type, { on, time }),
    // Show the change at once; roll back if the save fails.
    onMutate: async ({ type, on, time }) => {
      await queryClient.cancelQueries({ queryKey: qk.prefs });
      const before = queryClient.getQueryData<NotificationPref[]>(qk.prefs);
      queryClient.setQueryData<NotificationPref[]>(qk.prefs, (list) => list?.map((p) => (p.type === type ? { ...p, on, time } : p)));
      return { before };
    },
    onError: (error, _v, ctx) => {
      queryClient.setQueryData(qk.prefs, ctx?.before);
      showError(error);
    },
  });

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <p className="text-xs font-bold tracking-[0.12em] text-hint uppercase">{title}</p>
        {prefs.isSuccess
          ? keys.map((key) => {
              const pref = prefs.data.find((p) => p.type === key);
              if (!pref) return null;
              return (
                <div key={key} className="flex min-h-11 flex-wrap items-center gap-3">
                  <Label htmlFor={`pref-${key}`} className="flex-1 text-[15px] font-normal">
                    {t(`pref_${key}`)}
                  </Label>
                  {pref.time !== null && (
                    <Input
                      type="time"
                      dir="ltr"
                      aria-label={t("timeFor", { name: t(`pref_${key}`) })}
                      value={pref.time}
                      disabled={!pref.on}
                      onChange={(e) => e.target.value && save.mutate({ type: key, on: pref.on, time: e.target.value })}
                      className="h-10 w-28 tabular-nums"
                    />
                  )}
                  <Switch id={`pref-${key}`} checked={pref.on} onCheckedChange={(on) => save.mutate({ type: key, on, time: pref.time })} />
                </div>
              );
            })
          : keys.map((key) => <Skeleton key={key} className="h-11" />)}
        {hint && <p className="text-xs text-hint">{hint}</p>}
      </CardContent>
    </Card>
  );
}
