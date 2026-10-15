"use client";

import { api } from "@coachi/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/coachi/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { qk } from "@/lib/query-keys";
import { useNow } from "@/lib/use-now";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const toE164 = (v: string) => {
  const d = v.replace(/[^\d+]/g, "");
  return d.startsWith("+") ? d : d.startsWith("0") ? `+20${d.slice(1)}` : `+20${d}`;
};

/** Name, phone, email, plan, start and end. The app sends a login invite. */
export function AddCoachDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("admin.addCoach");
  const queryClient = useQueryClient();
  const plans = useQuery({ queryKey: qk.plans, queryFn: () => api.billing.plans(), enabled: open });
  const now = useNow();
  // Dates default to today and +14 days once the browser knows the time (never during prerender).
  const [form, setForm] = useState({ name: "", phone: "", email: "", planId: "", starts: "", ends: "" });
  const planId = form.planId || plans.data?.[0]?.plan.id || "";
  const starts = form.starts || (now ? iso(new Date(now)) : "");
  const ends = form.ends || (now ? iso(new Date(now + 14 * 86_400_000)) : "");

  const add = useMutation({
    mutationFn: () =>
      api.admin.addCoach({
        name: form.name.trim(),
        phone: toE164(form.phone),
        email: form.email.trim() || undefined,
        plan_id: planId,
        starts_at: new Date(`${starts}T00:00:00`).toISOString(),
        ends_at: new Date(`${ends}T23:00:00`).toISOString(),
      }),
    onSuccess: () => {
      toast.success(t("added"));
      for (const key of [qk.adminCoaches, qk.adminOverview, qk.directoryQueue, qk.audit]) void queryClient.invalidateQueries({ queryKey: key });
      onOpenChange(false);
      setForm((f) => ({ ...f, name: "", phone: "", email: "" }));
    },
  });

  const valid = form.name.trim().length > 1 && /^\+201[0125]\d{8}$/.test(toE164(form.phone)) && planId && !!starts && ends >= starts;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("title")}
      description={t("body")}
      footer={
        <Button className="w-full sm:w-auto" disabled={!valid || add.isPending} onClick={() => add.mutate()}>
          {add.isPending && <Loader2Icon className="animate-spin" />}
          {t("add")}
        </Button>
      }
    >
      <div className="grid gap-4 pb-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
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
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="c-plan">{t("plan")}</Label>
          <Select value={planId} onValueChange={(v) => setForm({ ...form, planId: v })}>
            <SelectTrigger id="c-plan" className="h-12 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(plans.data ?? []).map((p) => (
                <SelectItem key={p.plan.id} value={p.plan.id}>
                  {p.plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-start">{t("starts")}</Label>
          <Input id="c-start" type="date" dir="ltr" value={starts} onChange={set("starts")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-end">{t("ends")}</Label>
          <Input id="c-end" type="date" dir="ltr" value={ends} onChange={set("ends")} />
        </div>
      </div>
    </ResponsiveDialog>
  );
}
