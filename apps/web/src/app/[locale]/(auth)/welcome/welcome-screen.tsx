"use client";

import { api } from "@coachi/core";
import type { Locale } from "@coachi/i18n";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { FieldError } from "@/components/coachi/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sessionKey } from "@/hooks/use-session";
import { Link, useRouter } from "@/i18n/navigation";
import { roleHome } from "@/lib/roles";

/** Only same-site app paths, so ?next= can't send him somewhere else. */
const safeNext = (next: string | null) => (next && /^\/(app|coach)\//.test(next) ? next : null);

export function WelcomeScreen() {
  const t = useTranslations("welcome");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const queryClient = useQueryClient();
  const next = safeNext(useSearchParams().get("next"));
  const [name, setName] = useState("");
  const [tooShort, setTooShort] = useState(false);

  const save = useMutation({
    mutationFn: () => api.auth.completeProfile({ name, language: locale }),
    onSuccess: (session) => {
      queryClient.setQueryData(sessionKey, session);
      // A new client has no coach yet: the directory is his home until he joins one.
      router.replace(next ?? (session.profile.role === "client" ? "/app/coaches" : roleHome[session.profile.role]));
    },
  });

  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim().length < 2) return setTooShort(true);
        save.mutate();
      }}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          autoComplete="name"
          autoFocus
          maxLength={80}
          value={name}
          aria-invalid={tooShort}
          aria-describedby={tooShort ? "name-error" : undefined}
          onChange={(e) => {
            setName(e.target.value);
            setTooShort(false);
          }}
        />
        {tooShort && <FieldError id="name-error">{t("nameError")}</FieldError>}
      </div>
      <Button type="submit" size="lg" disabled={save.isPending}>
        {save.isPending && <Loader2Icon className="animate-spin" />}
        {t("continue")}
      </Button>
      {!next && (
        <p className="text-center text-sm text-muted-foreground">
          {t("coachQ")}{" "}
          <Link href={{ pathname: "/", hash: "coaches" }} className="font-semibold text-primary underline-offset-4 hover:underline">
            {t("coachLink")}
          </Link>
        </p>
      )}
    </form>
  );
}
