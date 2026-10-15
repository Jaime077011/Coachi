"use client";

import { api } from "@coachi/core";
import { localeDirection } from "@coachi/i18n";
import type { AdminCoachRow } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlusIcon, EyeIcon, Layers2Icon, PauseIcon, PlayIcon, ReceiptIcon, Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { StatusChip } from "@/components/coachi/status-chip";
import { ResponsiveDialog } from "@/components/coachi/responsive-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { subscriptionTone } from "@/lib/subscription-tone";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { useSupportMode } from "./support-mode";

/** Side sheet: details, payments, notes, and the actions. Opens from the end side (left in Arabic). */
export function CoachPanel({ coach, onOpenChange }: { coach: AdminCoachRow | null; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("admin.panel");
  const tSub = useTranslations("subscription");
  const tParts = useTranslations("parts");
  const locale = useLocale();
  const fmt = useFmt();
  const queryClient = useQueryClient();
  const { start } = useSupportMode();
  const [paying, setPaying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const payments = useQuery({ queryKey: qk.payments(coach?.org_id ?? ""), queryFn: () => api.billing.payments(coach!.org_id), enabled: !!coach });
  const plans = useQuery({ queryKey: qk.plans, queryFn: () => api.billing.plans(), enabled: !!coach });

  const refresh = () => {
    for (const key of [qk.adminCoaches, qk.adminOverview, qk.audit]) void queryClient.invalidateQueries({ queryKey: key });
  };
  const act = useMutation({
    mutationFn: async (action: "extend" | "pause" | "resume" | "delete" | { plan: string }) => {
      if (!coach) return;
      if (action === "extend") await api.admin.extend(coach.org_id, 7);
      else if (action === "pause") await api.admin.setStatus(coach.org_id, "paused");
      else if (action === "resume") await api.admin.setStatus(coach.org_id, "active");
      else if (action === "delete") await api.admin.deleteCoach(coach.coach_id);
      else await api.admin.changePlan(coach.org_id, action.plan);
    },
    onSuccess: (_d, action) => {
      refresh();
      toast.success(
        action === "extend" ? t("extended") : action === "pause" ? t("paused") : action === "resume" ? t("resumed") : action === "delete" ? t("deleted") : t("planChanged"),
      );
      if (action === "delete") onOpenChange(false);
    },
  });

  const side = localeDirection[locale] === "rtl" ? "left" : "right";

  return (
    <>
      <Sheet open={!!coach} onOpenChange={onOpenChange}>
        <SheetContent side={side} className="w-full gap-0 overflow-y-auto sm:max-w-md">
          {coach && (
            <>
              <SheetHeader className="border-b">
                <SheetTitle className="text-xl">
                  <bdi>{coach.name}</bdi>
                </SheetTitle>
                <SheetDescription asChild>
                  <div className="flex items-center gap-2">
                    <StatusChip tone={subscriptionTone[coach.status]}>{tSub(`status_${coach.status}`)}</StatusChip>
                    <span>{coach.plan_name}</span>
                  </div>
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-wrap gap-2 border-b p-4">
                <Button size="sm" onClick={() => setPaying(true)}>
                  <ReceiptIcon data-icon="inline-start" />
                  {t("recordPayment")}
                </Button>
                <Button size="sm" variant="secondary" disabled={act.isPending} onClick={() => act.mutate("extend")}>
                  <CalendarPlusIcon data-icon="inline-start" />
                  {t("extend")}
                </Button>
                {coach.status === "paused" ? (
                  <Button size="sm" variant="secondary" onClick={() => act.mutate("resume")}>
                    <PlayIcon data-icon="inline-start" />
                    {t("resume")}
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => act.mutate("pause")}>
                    <PauseIcon data-icon="inline-start" />
                    {t("pause")}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="secondary">
                      <Layers2Icon data-icon="inline-start" />
                      {t("changePlan")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {(plans.data ?? []).map((p) => (
                      <DropdownMenuItem key={p.plan.id} disabled={p.plan.name === coach.plan_name} onSelect={() => act.mutate({ plan: p.plan.id })}>
                        {p.plan.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" variant="secondary" onClick={() => void start(coach.coach_id, coach.name)}>
                  <EyeIcon data-icon="inline-start" />
                  {t("support")}
                </Button>
              </div>

              <Tabs defaultValue="details" className="p-4">
                <TabsList className="w-full">
                  <TabsTrigger value="details" className="flex-1">
                    {t("details")}
                  </TabsTrigger>
                  <TabsTrigger value="payments" className="flex-1">
                    {t("payments")}
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="flex-1">
                    {t("notes")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="mt-4">
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <Fact label={t("phone")}>
                      <span dir="ltr">{coach.phone ?? "—"}</span>
                    </Fact>
                    <Fact label={t("plan")}>{coach.plan_name}</Fact>
                    <Fact label={t("ends")}>{fmt.date(coach.ends_at)}</Fact>
                    <Fact label={t("clients")}>
                      <span className="tabular-nums">{fmt.num(coach.client_count)}</span>
                    </Fact>
                    <Fact label={t("listed")}>{coach.listed ? t("yes") : t("no")}</Fact>
                  </dl>
                </TabsContent>
                <TabsContent value="payments" className="mt-4">
                  {payments.data?.length ? (
                    <ul className="divide-y rounded-lg border text-sm">
                      {payments.data.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-3 p-3">
                          <span>{fmt.date(p.paid_at)}</span>
                          <span className="text-hint">{tParts(`paymentMethod.${p.method}`)}</span>
                          <span className="font-semibold tabular-nums">{fmt.egp(p.amount_piasters)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("noPayments")}</p>
                  )}
                </TabsContent>
                <TabsContent value="notes" className="mt-4">
                  <CoachNotes coachId={coach.coach_id} placeholder={t("notesPlaceholder")} label={t("notes")} />
                </TabsContent>
              </Tabs>

              <div className="mt-auto border-t p-4">
                <Button variant="destructive" className="w-full" onClick={() => (setConfirmName(""), setDeleting(true))}>
                  <Trash2Icon data-icon="inline-start" />
                  {t("delete")}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <RecordPaymentDialog key={coach?.org_id} open={paying} onOpenChange={setPaying} coach={coach} />

      {/* Delete can't be undone the normal way, so it asks you to type the name. */}
      <ResponsiveDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t("deleteTitle", { name: coach?.name ?? "" })}
        description={t("deleteBody")}
        footer={
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            disabled={confirmName.trim() !== coach?.name.trim() || act.isPending}
            onClick={() => {
              act.mutate("delete");
              setDeleting(false);
            }}
          >
            <Trash2Icon data-icon="inline-start" />
            {t("delete")}
          </Button>
        }
      >
        <Input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} placeholder={t("deleteConfirm")} aria-label={t("deleteConfirm")} />
      </ResponsiveDialog>
    </>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-hint">{label}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  );
}

/** Private admin notes. Kept in this browser until an admin_notes table lands in Step 4. */
function CoachNotes({ coachId, placeholder, label }: { coachId: string; placeholder: string; label: string }) {
  const key = `coachi.admin.note.${coachId}`;
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(key) ?? "";
    } catch {
      return "";
    }
  });
  return (
    <Textarea
      value={value}
      placeholder={placeholder}
      aria-label={label}
      className="min-h-32"
      onChange={(e) => {
        setValue(e.target.value);
        try {
          localStorage.setItem(key, e.target.value);
        } catch {
          // ignore
        }
      }}
    />
  );
}
