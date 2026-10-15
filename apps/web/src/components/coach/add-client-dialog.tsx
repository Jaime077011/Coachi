"use client";

import { api, ApiError } from "@coachi/core";
import { newClient } from "@coachi/validation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, CopyIcon, Loader2Icon, MessageCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { FieldError } from "@/components/coachi/field-error";
import { ResponsiveDialog } from "@/components/coachi/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMe } from "@/hooks/use-session";
import { qk } from "@/lib/query-keys";
import { whatsappUrl } from "@/lib/whatsapp";
import { LimitNotice } from "./limit-notice";

const toE164 = (v: string) => {
  const d = v.replace(/[^\d+]/g, "");
  return d.startsWith("+") ? d : d.startsWith("0") ? `+20${d.slice(1)}` : `+20${d}`;
};

/** Name and phone only → an invite link to copy or send on WhatsApp. */
export function AddClientDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("addClient");
  const tAuth = useTranslations("auth");
  const { coachId } = useMe();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: boolean; phone?: boolean }>({});
  const [copied, setCopied] = useState(false);

  const invite = useMutation({
    mutationFn: () => api.clients.invite({ name: name.trim(), phone: toE164(phone) }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk.clients(coachId) }),
  });

  const reset = () => {
    setName("");
    setPhone("");
    setErrors({});
    setCopied(false);
    invite.reset();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = newClient.safeParse({ name: name.trim(), phone: toE164(phone) });
    const phoneOk = parsed.success || !parsed.error.issues.some((i) => i.path[0] === "phone");
    const nameOk = parsed.success || !parsed.error.issues.some((i) => i.path[0] === "name");
    setErrors({ name: !nameOk, phone: !phoneOk || !/^\+201[0125]\d{8}$/.test(toE164(phone)) });
    if (parsed.success && /^\+201[0125]\d{8}$/.test(toE164(phone))) invite.mutate();
  };

  const limit = invite.error instanceof ApiError && invite.error.code === "limit_reached";
  const inactive = invite.error instanceof ApiError && invite.error.code === "inactive";
  const result = invite.data;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
      title={result ? t("linkTitle") : t("title")}
      description={result ? t("linkBody", { name: name.trim() }) : t("body")}
      footer={
        result ? (
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                void navigator.clipboard?.writeText(result.inviteUrl);
                setCopied(true);
                toast.success(t("copied"));
              }}
            >
              {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
              {t("copy")}
            </Button>
            <Button asChild>
              <a
                href={whatsappUrl(toE164(phone), t("inviteMessage", { name: name.trim().split(" ")[0]!, url: result.inviteUrl }))}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircleIcon data-icon="inline-start" />
                {t("share")}
              </a>
            </Button>
          </div>
        ) : limit || inactive ? undefined : (
          <Button type="submit" form="add-client" className="w-full sm:w-auto" disabled={invite.isPending}>
            {invite.isPending && <Loader2Icon className="animate-spin" />}
            {t("create")}
          </Button>
        )
      }
    >
      {result ? (
        <p className="rounded-md border bg-secondary p-3 text-sm break-all" dir="ltr">
          {result.inviteUrl}
        </p>
      ) : limit || inactive ? (
        <LimitNotice reason={inactive ? "inactive" : "limit"} />
      ) : (
        <form id="add-client" onSubmit={submit} className="flex flex-col gap-4 pb-2" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ac-name">{t("name")}</Label>
            <Input id="ac-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} aria-invalid={errors.name} />
            {errors.name && <FieldError>{t("invalidName")}</FieldError>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ac-phone">{t("phone")}</Label>
            <Input
              id="ac-phone"
              type="tel"
              dir="ltr"
              inputMode="tel"
              placeholder="01001234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={errors.phone}
            />
            {errors.phone && <FieldError>{tAuth("invalidPhone")}</FieldError>}
          </div>
        </form>
      )}
    </ResponsiveDialog>
  );
}
