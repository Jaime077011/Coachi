"use client";

import { api } from "@coachi/core";
import { clientsCount, phone as phoneSchema } from "@coachi/validation";
import { useMutation } from "@tanstack/react-query";
import { CircleCheckBigIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FieldError } from "@/components/coachi/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useApiErrorToast } from "@/lib/api-error";

/** "01001234567" → "+201001234567". */
const toE164 = (v: string) => {
  const d = v.replace(/[^\d+]/g, "");
  return d.startsWith("+") ? d : d.startsWith("0") ? `+20${d.slice(1)}` : `+20${d}`;
};

type Count = (typeof clientsCount.options)[number];

/** Coaches can't sign up alone: they tell us about themselves and we set them up on WhatsApp. */
export function CoachLeadForm() {
  const t = useTranslations("home");
  const showError = useApiErrorToast();
  const [form, setForm] = useState({ name: "", phone: "", city: "", message: "" });
  const [count, setCount] = useState<Count>("under_10");
  const [errors, setErrors] = useState<{ name?: boolean; phone?: boolean }>({});

  const send = useMutation({
    mutationFn: () =>
      api.directory.requestCoachAccess({
        name: form.name.trim(),
        phone: toE164(form.phone),
        city: form.city.trim() || null,
        clients_count: count,
        message: form.message.trim() || null,
      }),
    onError: showError,
  });

  if (send.isSuccess) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-6 text-center">
        <CircleCheckBigIcon className="size-10 text-success" aria-hidden />
        <p className="text-lg font-semibold">{t("formSentTitle", { name: send.data.name })}</p>
        <p className="text-sm text-muted-foreground">{t("formSentBody")}</p>
      </div>
    );
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [k]: e.target.value });
    if (k === "name" || k === "phone") setErrors((x) => ({ ...x, [k]: false }));
  };

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const next = { name: form.name.trim().length < 2, phone: !phoneSchema.safeParse(toE164(form.phone)).success };
        setErrors(next);
        if (!next.name && !next.phone) send.mutate();
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lead-name">{t("formName")}</Label>
        <Input id="lead-name" autoComplete="name" maxLength={80} value={form.name} onChange={set("name")} aria-invalid={errors.name} aria-describedby={errors.name ? "lead-name-error" : undefined} />
        {errors.name && <FieldError id="lead-name-error">{t("formNameError")}</FieldError>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lead-phone">{t("formPhone")}</Label>
        <Input
          id="lead-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          placeholder="01001234567"
          value={form.phone}
          onChange={set("phone")}
          aria-invalid={errors.phone}
          aria-describedby={errors.phone ? "lead-phone-error" : undefined}
        />
        {errors.phone && <FieldError id="lead-phone-error">{t("formPhoneError")}</FieldError>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lead-city">{t("formCity")}</Label>
        <Input id="lead-city" autoComplete="address-level2" maxLength={60} value={form.city} onChange={set("city")} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>{t("formClients")}</Label>
        <ToggleGroup type="single" variant="outline" value={count} onValueChange={(v) => v && setCount(v as Count)} className="grid w-full grid-cols-3">
          {clientsCount.options.map((c) => (
            <ToggleGroupItem key={c} value={c} className="h-11">
              {t(`clients_${c}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lead-message">{t("formMessage")}</Label>
        <Textarea id="lead-message" maxLength={500} placeholder={t("formMessagePlaceholder")} value={form.message} onChange={set("message")} />
      </div>
      <Button type="submit" size="lg" disabled={send.isPending}>
        {send.isPending && <Loader2Icon className="animate-spin" />}
        {t("formSend")}
      </Button>
    </form>
  );
}
