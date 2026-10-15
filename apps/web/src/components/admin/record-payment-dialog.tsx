"use client";

import { api } from "@coachi/core";
import { paymentMethod, type AdminCoachRow, type PaymentMethod } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheckIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { PhotoSlot } from "@/components/coachi/photo-slot";
import { ResponsiveDialog } from "@/components/coachi/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { useNow } from "@/lib/use-now";

const DAY = 86_400_000;

/** Coach, amount in EGP, method, date, receipt. Shows the new end date before you save. */
export function RecordPaymentDialog({
  open,
  onOpenChange,
  coach,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preselected from the coach panel; otherwise pick one. */
  coach?: AdminCoachRow | null;
}) {
  const t = useTranslations("admin.payment");
  const tParts = useTranslations("parts");
  const fmt = useFmt();
  const now = useNow();
  const queryClient = useQueryClient();
  const coaches = useQuery({ queryKey: qk.adminCoaches, queryFn: () => api.admin.coaches(), enabled: open });
  const plans = useQuery({ queryKey: qk.plans, queryFn: () => api.billing.plans(), enabled: open });
  const [orgId, setOrgId] = useState(coach?.org_id ?? "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("instapay");
  const [pickedDate, setDate] = useState("");
  const date = pickedDate || (now ? new Date(now).toISOString().slice(0, 10) : "");
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);

  const selected = coaches.data?.find((c) => c.org_id === (coach?.org_id ?? orgId));
  const planDays = plans.data?.find((p) => p.plan.name === selected?.plan_name)?.plan.days ?? 30;
  const newEnd = selected && now ? new Date(Math.max(now, Date.parse(selected.ends_at)) + planDays * DAY).toISOString() : null;

  const save = useMutation({
    mutationFn: () =>
      api.billing.recordPayment({
        org_id: selected!.org_id,
        amount_piasters: Math.round(Number(amount.replace(",", ".")) * 100),
        method,
        paid_on: date,
        note: note.trim() || undefined,
        receipt_path: receipt ? `receipts/${receipt.name}` : undefined,
      }),
    onSuccess: ({ subscription }) => {
      toast.success(t("saved", { date: fmt.date(subscription.ends_at, "short") }));
      for (const key of [qk.adminCoaches, qk.adminOverview, qk.payments(subscription.org_id), qk.audit]) void queryClient.invalidateQueries({ queryKey: key });
      onOpenChange(false);
      setAmount("");
      setNote("");
      setReceipt(null);
    },
  });

  const valid = !!selected && Number(amount.replace(",", ".")) > 0 && !!date;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("title")}
      footer={
        <Button className="w-full sm:w-auto" disabled={!valid || save.isPending} onClick={() => save.mutate()}>
          {save.isPending && <Loader2Icon className="animate-spin" />}
          {t("save")}
        </Button>
      }
    >
      <div className="grid gap-4 pb-2 sm:grid-cols-2">
        {!coach && (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="pay-coach">{t("coach")}</Label>
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger id="pay-coach" className="h-12 w-full">
                <SelectValue placeholder={t("pickCoach")} />
              </SelectTrigger>
              <SelectContent>
                {(coaches.data ?? []).map((c) => (
                  <SelectItem key={c.org_id} value={c.org_id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pay-amount">{t("amount")}</Label>
          <Input id="pay-amount" dir="ltr" inputMode="decimal" className="tabular-nums" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pay-method">{t("method")}</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
            <SelectTrigger id="pay-method" className="h-12 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {paymentMethod.options.map((m) => (
                <SelectItem key={m} value={m}>
                  {tParts(`paymentMethod.${m}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pay-date">{t("date")}</Label>
          <Input id="pay-date" type="date" dir="ltr" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pay-note">{t("note")}</Label>
          <Input id="pay-note" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-semibold">{t("receipt")}</span>
          <PhotoSlot label={t("receipt")} file={receipt} onChange={setReceipt} className="aspect-[3/2] max-w-48" />
        </div>
        {newEnd && (
          <p className="flex items-center gap-2 rounded-md bg-success/12 p-3 text-sm font-semibold text-success sm:col-span-2">
            <CalendarCheckIcon className="size-4" aria-hidden />
            {t("newEnd", { date: fmt.date(newEnd, "long") })}
          </p>
        )}
      </div>
    </ResponsiveDialog>
  );
}
