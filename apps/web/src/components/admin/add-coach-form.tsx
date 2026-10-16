"use client";

import { api } from "@coachi/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { ScreenPanel } from "@/components/coachi/screen-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { qk } from "@/lib/query-keys";
import { useNow } from "@/lib/use-now";

const DAY = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const toE164 = (v: string) => {
  const d = v.replace(/[^\d+]/g, "");
  return d.startsWith("+") ? d : d.startsWith("0") ? `+20${d.slice(1)}` : `+20${d}`;
};
const toInt = (v: string) => Math.max(0, Math.round(Number(v)) || 0);

/**
 * Name, phone, email, seats, start and end. New coaches start on the free trial (trial seats, no
 * team seats, trial length) from Pricing; the admin can change any of it. The app sends a login invite.
 * Its own screen: /admin/coaches/new.
 */
export function AddCoachForm({
  back,
  initial,
  onAdded,
}: {
  back: string;
  /** Prefill from a home-page coach request. */
  initial?: { name: string; phone: string };
  /** After saving (e.g. mark the coach request as added), then it goes back. */
  onAdded?: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("admin.addCoach");
  const queryClient = useQueryClient();
  const pricing = useQuery({ queryKey: qk.pricing, queryFn: () => api.billing.pricing() });
  const now = useNow();
  // Empty = use the trial defaults (and today) once they're known; never during prerender.
  const [form, setForm] = useState({ name: initial?.name ?? "", phone: initial?.phone ?? "", email: "", clientSeats: "", teamSeats: "", starts: "", ends: "" });
  const trial = pricing.data;
  const clientSeats = form.clientSeats === "" ? (trial?.trial_client_seats ?? 5) : toInt(form.clientSeats);
  const teamSeats = form.teamSeats === "" ? 0 : toInt(form.teamSeats);
  const starts = form.starts || (now ? iso(new Date(now)) : "");
  const ends = form.ends || (now ? iso(new Date(now + (trial?.trial_days ?? 14) * DAY)) : "");

  const add = useMutation({
    mutationFn: () =>
      api.admin.addCoach({
        name: form.name.trim(),
        phone: toE164(form.phone),
        email: form.email.trim() || undefined,
        client_seats: clientSeats,
        team_seats: teamSeats,
        starts_at: new Date(`${starts}T00:00:00`).toISOString(),
        ends_at: new Date(`${ends}T23:00:00`).toISOString(),
      }),
    onSuccess: () => {
      toast.success(t("added"));
      for (const key of [qk.adminCoaches, qk.adminOverview, qk.directoryQueue, qk.audit]) void queryClient.invalidateQueries({ queryKey: key });
      onAdded?.();
      router.push(back);
    },
  });

  const valid = form.name.trim().length > 1 && /^\+201[0125]\d{8}$/.test(toE164(form.phone)) && !!starts && ends >= starts;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <ScreenPanel
      back={back}
      title={t("title")}
      description={t("body")}
      footer={
        <Button disabled={!valid || add.isPending} onClick={() => add.mutate()}>
          {add.isPending && <Loader2Icon className="animate-spin" />}
          {t("add")}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-name">{t("name")}</Label>
          <Input id="c-name" value={form.name} onChange={set("name")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-phone">{t("phone")}</Label>
          <Input id="c-phone" type="tel" dir="ltr" placeholder="01001234567" value={form.phone} onChange={set("phone")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-email">{t("email")}</Label>
          <Input id="c-email" type="email" dir="ltr" value={form.email} onChange={set("email")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-client-seats">{t("clientSeats")}</Label>
          <Input id="c-client-seats" dir="ltr" inputMode="numeric" className="tabular-nums" value={form.clientSeats === "" ? String(clientSeats) : form.clientSeats} onChange={set("clientSeats")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-team-seats">{t("teamSeats")}</Label>
          <Input id="c-team-seats" dir="ltr" inputMode="numeric" className="tabular-nums" value={form.teamSeats === "" ? String(teamSeats) : form.teamSeats} onChange={set("teamSeats")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-start">{t("starts")}</Label>
          <Input id="c-start" type="date" dir="ltr" value={starts} onChange={set("starts")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-end">{t("ends")}</Label>
          <Input id="c-end" type="date" dir="ltr" value={ends} onChange={set("ends")} />
        </div>
        {trial && <p className="text-sm text-muted-foreground">{t("trialNote", { days: trial.trial_days, seats: trial.trial_client_seats })}</p>}
      </div>
    </ScreenPanel>
  );
}
