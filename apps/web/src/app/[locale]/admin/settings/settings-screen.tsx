"use client";

import { api } from "@coachi/core";
import type { AppSettings } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Mark } from "@/components/brand/logo";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenHeader, SectionTitle } from "@/components/coachi/screen-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";

export function SettingsScreen() {
  const t = useTranslations("admin.settings");
  const settings = useQuery({ queryKey: ["app-settings"], queryFn: () => api.admin.settings() });
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title={t("title")} />
      <QueryState query={settings}>{(s) => <SettingsForm initial={s} />}</QueryState>
    </div>
  );
}

function SettingsForm({ initial }: { initial: AppSettings }) {
  const t = useTranslations("admin.settings");
  const tPricing = useTranslations("admin.pricing");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initial);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const save = useMutation({
    mutationFn: () => api.admin.saveSettings(form),
    onSuccess: (saved) => {
      queryClient.setQueryData(["app-settings"], saved);
      toast.success(t("saved"));
    },
  });

  return (
    <div className="flex flex-col gap-5 pb-24">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="s-name">{t("appName")}</Label>
        <Input id="s-name" value={form.app_name} onChange={(e) => setForm({ ...form, app_name: e.target.value })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{t("logo")}</Label>
        <div className="flex items-center gap-3">
          <Mark size={48} />
          <Input type="url" dir="ltr" placeholder="https://…" value={form.logo_url ?? ""} onChange={(e) => setForm({ ...form, logo_url: e.target.value || null })} aria-label={t("logo")} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="s-wa">{t("supportWhatsapp")}</Label>
        <Input id="s-wa" type="tel" dir="ltr" value={form.support_whatsapp} onChange={(e) => setForm({ ...form, support_whatsapp: e.target.value })} />
      </div>
      <section>
        <SectionTitle>{t("limits")}</SectionTitle>
        <Button asChild variant="secondary">
          <Link href="/admin/pricing">{tPricing("title")}</Link>
        </Button>
      </section>

      {/* Unsaved changes: a sticky Save bar. */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t glass-strong pb-[env(safe-area-inset-bottom)] lg:ps-(--shell-inset)">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
            <TriangleAlertIcon className="size-5 text-warning" aria-hidden />
            <span className="flex-1 text-sm font-semibold">{t("unsaved")}</span>
            <Button variant="ghost" onClick={() => setForm(initial)}>
              {tCommon("cancel")}
            </Button>
            <Button disabled={save.isPending} onClick={() => save.mutate()}>
              {save.isPending && <Loader2Icon className="animate-spin" />}
              {t("save")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
