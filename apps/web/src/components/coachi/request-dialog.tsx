"use client";

import { api } from "@coachi/core";
import type { CoachPackage, Goal, SendRequest } from "@coachi/validation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleCheckIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSession } from "@/hooks/use-session";
import { Link } from "@/i18n/navigation";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { ResponsiveDialog } from "./responsive-dialog";

const goals: Goal[] = ["fat_loss", "muscle", "strength", "health"];

/**
 * Send a request to a coach: from the in-app coach page, or from his public landing page.
 * On the landing page a visitor who isn't signed in as a client logs in first, and sees a
 * "Request sent" step at the end instead of a toast.
 */
export function RequestDialog({
  coachId,
  coachName,
  packages = [],
  packageId: initialPackage = null,
  source,
  open,
  onOpenChange,
}: {
  coachId: string;
  coachName: string;
  packages?: CoachPackage[];
  packageId?: string | null;
  source: NonNullable<SendRequest["source"]>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("coachPage");
  const tLanding = useTranslations("landing");
  const tParts = useTranslations("parts");
  const fmt = useFmt();
  const queryClient = useQueryClient();
  const session = useSession();
  const [packageId, setPackageId] = useState<string | null>(initialPackage);
  const [goal, setGoal] = useState<Goal>("fat_loss");
  const [message, setMessage] = useState("");
  const [contactBy, setContactBy] = useState<SendRequest["contact_by"]>("whatsapp");

  // Re-sync the chosen package each time the dialog opens from a different package card.
  const [openedWith, setOpenedWith] = useState(initialPackage);
  if (open && openedWith !== initialPackage) {
    setOpenedWith(initialPackage);
    setPackageId(initialPackage);
  }

  const send = useMutation({
    mutationFn: () =>
      api.directory.sendRequest({ coach_id: coachId, goal, message: message.trim(), contact_by: contactBy, source, package_id: packageId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.coachPage(coachId) });
      if (source === "directory") {
        onOpenChange(false);
        toast.success(t("sentToast"));
      }
    },
  });

  const signedInAsClient = session.data?.profile.role === "client";
  const step = send.isSuccess && source === "landing" ? "sent" : signedInAsClient ? "form" : "login";

  const title =
    step === "sent" ? tLanding("sentTitle") : step === "login" ? tLanding("loginTitle", { coach: coachName }) : t("requestTitle", { coach: coachName });
  const description = step === "sent" ? tLanding("sentBody", { coach: coachName }) : step === "login" ? tLanding("loginBody") : t("requestBody");

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o && send.isSuccess) send.reset();
      }}
      title={title}
      description={description}
      footer={
        step === "form" ? (
          <Button className="w-full sm:w-auto" disabled={send.isPending} onClick={() => send.mutate()}>
            {send.isPending && <Loader2Icon className="animate-spin" />}
            {t("send")}
          </Button>
        ) : step === "sent" ? (
          <Button asChild className="w-full sm:w-auto">
            <Link href="/app/today">{tLanding("openApp")}</Link>
          </Button>
        ) : undefined
      }
    >
      {step === "sent" ? (
        <div className="flex justify-center py-4">
          <CircleCheckIcon className="size-14 text-success" aria-hidden />
        </div>
      ) : step === "login" ? (
        <div className="pb-4">
          <LoginForm
            afterLogin={(s) => {
              if (s.profile.role !== "client") toast.error(tLanding("onlyClients"));
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-5 pb-2">
          {packages.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>{tLanding("package")}</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                value={packageId ?? "none"}
                onValueChange={(v) => v && setPackageId(v === "none" ? null : v)}
                className="flex w-full flex-col items-stretch"
              >
                {packages.map((p) => (
                  <ToggleGroupItem key={p.id} value={p.id} className="h-auto min-h-11 justify-between gap-3 py-2 text-start">
                    <span className="truncate">{p.name}</span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">{fmt.egp(p.price_piasters)}</span>
                  </ToggleGroupItem>
                ))}
                <ToggleGroupItem value="none" className="h-11 justify-start">
                  {tLanding("noPackage")}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label>{t("goal")}</Label>
            <ToggleGroup type="single" variant="outline" value={goal} onValueChange={(v) => v && setGoal(v as Goal)} className="grid w-full grid-cols-2">
              {goals.map((g) => (
                <ToggleGroupItem key={g} value={g} className="h-11">
                  {tParts(`goalName.${g}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="req-msg">{t("message")}</Label>
            <Textarea id="req-msg" maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("messagePlaceholder")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("contactBy")}</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              value={contactBy}
              onValueChange={(v) => v && setContactBy(v as SendRequest["contact_by"])}
              className="w-full"
            >
              <ToggleGroupItem value="whatsapp" className="h-11 flex-1">
                {t("contactWhatsapp")}
              </ToggleGroupItem>
              <ToggleGroupItem value="app" className="h-11 flex-1">
                {t("contactApp")}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      )}
    </ResponsiveDialog>
  );
}
