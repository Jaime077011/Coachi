"use client";

import { api, ApiError, dataSource } from "@coachi/core";
import { email as emailSchema, phone as phoneSchema, type Session } from "@coachi/validation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, MailIcon, SmartphoneIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FieldError } from "@/components/coachi/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { sessionKey } from "@/hooks/use-session";
import { useRouter } from "@/i18n/navigation";
import { roleHome } from "@/lib/roles";

/** "01001234567" → "+201001234567". Accepts +20… as typed too. */
function toE164(local: string) {
  const digits = local.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return `+20${digits.slice(1)}`;
  if (digits.startsWith("20")) return `+${digits}`;
  return `+20${digits}`;
}

/** Phone code is the main way in; email magic link + code is the fallback. */
export function LoginForm({ afterLogin }: { afterLogin?: (session: Session) => void }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [value, setValue] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const request = useMutation({
    mutationFn: (target: string) =>
      api.auth.requestCode(method === "phone" ? { method, phone: target } : { method, email: target }),
    onSuccess: ({ sentTo }) => setSentTo(sentTo),
  });

  const verify = useMutation({
    mutationFn: () => api.auth.verifyCode({ method, target: sentTo!, code }),
    onSuccess: (session) => {
      queryClient.setQueryData(sessionKey, session);
      if (afterLogin) afterLogin(session);
      // First login (no name yet): the welcome step, then the directory to find a coach.
      else if (!session.profile.name) router.replace("/welcome");
      else router.replace(roleHome[session.profile.role]);
    },
  });

  const submitTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const target = method === "phone" ? toE164(value) : value.trim();
    const ok = (method === "phone" ? phoneSchema : emailSchema).safeParse(target).success && (method !== "phone" || /^\+201[0125]\d{8}$/.test(target));
    if (!ok) return setFieldError(method === "phone" ? t("invalidPhone") : t("invalidEmail"));
    setFieldError(null);
    request.mutate(target);
  };

  if (sentTo) {
    const wrong = verify.error instanceof ApiError && verify.error.code === "invalid";
    return (
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.length === 6) verify.mutate();
        }}
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">{t("codeTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t.rich("codeSent", {
              target: sentTo,
              b: (chunks) => (
                <bdi dir="ltr" className="font-semibold text-foreground">
                  {chunks}
                </bdi>
              ),
            })}{" "}
            <button type="button" className="font-semibold text-primary underline-offset-4 hover:underline" onClick={() => setSentTo(null)}>
              {t("changeNumber")}
            </button>
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code">{t("code")}</Label>
          <Input
            id="code"
            dir="ltr"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            aria-invalid={wrong}
            aria-describedby={wrong ? "code-error" : undefined}
            className="h-14 text-center text-2xl font-bold tracking-[0.5em] tabular-nums"
          />
          {wrong && <FieldError id="code-error">{t("wrongCode")}</FieldError>}
        </div>
        <Button type="submit" size="lg" disabled={code.length !== 6 || verify.isPending}>
          {verify.isPending && <Loader2Icon className="animate-spin" />}
          {t("verify")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => request.mutate(sentTo)} disabled={request.isPending}>
          {t("resend")}
        </Button>
        {dataSource === "mock" && <p className="text-center text-xs text-hint">{t("mockHint")}</p>}
      </form>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={submitTarget} noValidate>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <ToggleGroup
        type="single"
        variant="outline"
        value={method}
        onValueChange={(v) => {
          if (!v) return;
          setMethod(v as "phone" | "email");
          setValue("");
          setFieldError(null);
        }}
        className="w-full"
      >
        <ToggleGroupItem value="phone" className="h-11 flex-1 gap-2">
          <SmartphoneIcon aria-hidden />
          {t("byPhone")}
        </ToggleGroupItem>
        <ToggleGroupItem value="email" className="h-11 flex-1 gap-2">
          <MailIcon aria-hidden />
          {t("byEmail")}
        </ToggleGroupItem>
      </ToggleGroup>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="target">{method === "phone" ? t("phone") : t("email")}</Label>
        <Input
          id="target"
          dir="ltr"
          type={method === "phone" ? "tel" : "email"}
          inputMode={method === "phone" ? "tel" : "email"}
          autoComplete={method === "phone" ? "tel-national" : "email"}
          placeholder={method === "phone" ? "01001234567" : "name@example.com"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={!!fieldError}
          aria-describedby={fieldError ? "target-error" : "target-hint"}
        />
        {fieldError ? (
          <FieldError id="target-error">{fieldError}</FieldError>
        ) : (
          method === "phone" && (
            <p id="target-hint" className="text-xs text-hint">
              {t("phoneHint")}
            </p>
          )
        )}
      </div>
      <Button type="submit" size="lg" disabled={!value || request.isPending}>
        {request.isPending && <Loader2Icon className="animate-spin" />}
        {t("sendCode")}
      </Button>
    </form>
  );
}

