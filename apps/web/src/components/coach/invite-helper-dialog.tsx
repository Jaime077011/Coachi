"use client";

import { api, ApiError } from "@coachi/core";
import { helperRole, newTeamMember, type HelperRole } from "@coachi/validation";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMe } from "@/hooks/use-session";
import { isEgyptMobile, toE164 } from "@/lib/phone";
import { qk } from "@/lib/query-keys";
import { whatsappUrl } from "@/lib/whatsapp";
import { SeatsNotice } from "./seats-notice";

/** Name, phone, and role → an invite link to copy or send on WhatsApp. Same flow as Add client. */
export function InviteHelperDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("team");
  const tAuth = useTranslations("auth");
  const { orgId } = useMe();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<HelperRole>("coach");
  const [errors, setErrors] = useState<{ name?: boolean; phone?: boolean }>({});
  const [copied, setCopied] = useState(false);

  const invite = useMutation({
    mutationFn: () => api.team.invite({ name: name.trim(), phone: toE164(phone), role }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk.team(orgId) }),
  });

  const reset = () => {
    setName("");
    setPhone("");
    setRole("coach");
    setErrors({});
    setCopied(false);
    invite.reset();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = newTeamMember.safeParse({ name: name.trim(), phone: toE164(phone), role });
    const bad = (field: string) => !parsed.success && parsed.error.issues.some((i) => i.path[0] === field);
    const next = { name: bad("name"), phone: bad("phone") || !isEgyptMobile(toE164(phone)) };
    setErrors(next);
    if (!next.name && !next.phone) invite.mutate();
  };

  const full = invite.error instanceof ApiError && invite.error.code === "limit_reached";
  const result = invite.data;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
      title={result ? t("linkTitle") : t("inviteTitle")}
      description={result ? t("linkBody", { name: name.trim() }) : full ? undefined : t("inviteBody")}
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
              {t("copyLink")}
            </Button>
            <Button asChild>
              <a
                href={whatsappUrl(
                  toE164(phone),
                  t("inviteMessage", { name: name.trim().split(" ")[0]!, role: t(`role_${role}`), url: result.inviteUrl }),
                )}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircleIcon data-icon="inline-start" />
                {t("share")}
              </a>
            </Button>
          </div>
        ) : full ? undefined : (
          <Button type="submit" form="invite-helper" className="w-full sm:w-auto" disabled={invite.isPending}>
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
      ) : full ? (
        <SeatsNotice full />
      ) : (
        <form id="invite-helper" onSubmit={submit} className="flex flex-col gap-4 pb-2" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ih-name">{t("name")}</Label>
            <Input id="ih-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} aria-invalid={errors.name} />
            {errors.name && <FieldError>{t("invalidName")}</FieldError>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ih-phone">{t("phone")}</Label>
            <Input
              id="ih-phone"
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
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">{t("role")}</legend>
            <RadioGroup value={role} onValueChange={(v) => setRole(v as HelperRole)} className="gap-2">
              {helperRole.options.map((r) => (
                <Label
                  key={r}
                  htmlFor={`ih-role-${r}`}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal has-data-[state=checked]:border-primary"
                >
                  <RadioGroupItem id={`ih-role-${r}`} value={r} className="mt-0.5" />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-semibold">{t(`role_${r}`)}</span>
                    <span className="text-sm text-muted-foreground">{t(`roleDesc_${r}`)}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </fieldset>
        </form>
      )}
    </ResponsiveDialog>
  );
}
