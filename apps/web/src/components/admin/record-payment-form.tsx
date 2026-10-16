"use client";

import { api } from "@coachi/core";
import { paymentMethod, periodPrice, type PaymentMethod } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheckIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { PhotoSlot } from "@/components/coachi/photo-slot";
import { ScreenPanel } from "@/components/coachi/screen-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { useNow } from "@/lib/use-now";

const DAY = 86_400_000;
const toInt = (v: string) => Math.max(0, Math.round(Number(v)) || 0);

/**
 * Coach, seats, how many periods, then the amount (worked out from the seats, editable for a
 * discount), method, date, receipt. Shows the new end date before you save. Saving sets his seats.
 * Its own screen: /admin/payments/new.
 */
export function RecordPaymentForm({
  back,
  orgId: presetOrg,
}: {
  back: string;
  /** Preselected from the coach page; otherwise pick one. */
  orgId?: string | null;
}) {
  const router = useRouter();
  const t = useTranslations("admin.payment");
  const tParts = useTranslations("parts");
  const fmt = useFmt();
  const now = useNow();
  const queryClient = useQueryClient();
  const coaches = useQuery({ queryKey: qk.adminCoaches, queryFn: () => api.admin.coaches() });
  const pricing = useQuery({ queryKey: qk.pricing, queryFn: () => api.billing.pricing() });
  const [orgId, setOrgId] = useState(presetOrg ?? "");
  // Empty = use the coach's current seats.
  const [clientSeatsIn, setClientSeats] = useState("");
  const [teamSeatsIn, setTeamSeats] = useState("");
  const [periods, setPeriods] = useState(1);
  const [amountIn, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("instapay");
  const [pickedDate, setDate] = useState("");
  const date = pickedDate || (now ? new Date(now).toISOString().slice(0, 10) : "");
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);

  const selected = coaches.data?.find((c) => c.org_id === orgId);
  const p = pricing.data;
  const clientSeats = clientSeatsIn === "" ? (selected?.client_seats ?? 0) : toInt(clientSeatsIn);
  const teamSeats = teamSeatsIn === "" ? (selected?.team_seats ?? 0) : toInt(teamSeatsIn);
  const suggested = p ? periodPrice(p, clientSeats, teamSeats) * periods : 0;
  // Until the admin types an amount, it follows the seats.
  const amountPiasters = amountIn === "" ? suggested : Math.round(Number(amountIn.replace(",", ".")) * 100) || 0;
  const newEnd = selected && now && p ? new Date(Math.max(now, Date.parse(selected.ends_at)) + periods * p.period_days * DAY).toISOString() : null;

  const save = useMutation({
    mutationFn: () =>
      api.billing.recordPayment({
        org_id: selected!.org_id,
        client_seats: clientSeats,
        team_seats: teamSeats,
        periods,
        amount_piasters: amountPiasters,
        method,
        paid_on: date,
        note: note.trim() || undefined,
        receipt_path: receipt ? `receipts/${receipt.name}` : undefined,
      }),
    onSuccess: ({ subscription }) => {
      toast.success(t("saved", { date: fmt.date(subscription.ends_at, "short") }));
      for (const key of [qk.adminCoaches, qk.adminOverview, qk.payments(subscription.org_id), qk.subscription(subscription.org_id), qk.audit])
        void queryClient.invalidateQueries({ queryKey: key });
      router.push(back);
    },
  });

  const valid = !!selected && amountPiasters > 0 && !!date;

  return (
    <ScreenPanel
      back={back}
      title={t("title")}
      description={presetOrg ? selected?.name : undefined}
      footer={
        <Button disabled={!valid || save.isPending} onClick={() => save.mutate()}>
          {save.isPending && <Loader2Icon className="animate-spin" />}
          {t("save")}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {!presetOrg && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-coach">{t("coach")}</Label>
            <Select
              value={orgId}
              onValueChange={(v) => {
                setOrgId(v);
                setClientSeats("");
                setTeamSeats("");
              }}
            >
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
          <Label htmlFor="pay-client-seats">{t("clientSeats")}</Label>
          <Input
            id="pay-client-seats"
            dir="ltr"
            inputMode="numeric"
            className="tabular-nums"
            value={clientSeatsIn === "" ? String(clientSeats) : clientSeatsIn}
            onChange={(e) => setClientSeats(e.target.value)}
          />
          {selected && <p className="text-xs text-hint">{t("seatsUsed", { used: selected.client_count })}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pay-team-seats">{t("teamSeats")}</Label>
          <Input
            id="pay-team-seats"
            dir="ltr"
            inputMode="numeric"
            className="tabular-nums"
            value={teamSeatsIn === "" ? String(teamSeats) : teamSeatsIn}
            onChange={(e) => setTeamSeats(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pay-periods">{t("periods")}</Label>
          <Select value={String(periods)} onValueChange={(v) => setPeriods(Number(v))}>
            <SelectTrigger id="pay-periods" className="h-12 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 6, 12].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {t("periodsValue", { count: n, days: (p?.period_days ?? 30) * n })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pay-amount">{t("amount")}</Label>
          <Input
            id="pay-amount"
            dir="ltr"
            inputMode="decimal"
            className="tabular-nums"
            value={amountIn === "" ? String(suggested / 100) : amountIn}
            onChange={(e) => setAmount(e.target.value)}
          />
          {p && (
            <p className="text-xs text-hint tabular-nums" dir="ltr">
              {t("breakdown", {
                clients: clientSeats,
                clientPrice: fmt.egp(p.client_seat_piasters),
                team: teamSeats,
                teamPrice: fmt.egp(p.team_seat_piasters),
                periods,
                total: fmt.egp(suggested),
              })}
            </p>
          )}
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
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{t("receipt")}</span>
          <PhotoSlot label={t("receipt")} file={receipt} onChange={setReceipt} className="aspect-[3/2] max-w-48" />
        </div>
        {newEnd && (
          <p className="flex items-center gap-2 rounded-md bg-success/12 p-3 text-sm font-semibold text-success">
            <CalendarCheckIcon className="size-4" aria-hidden />
            {t("newEnd", { date: fmt.date(newEnd, "long") })}
          </p>
        )}
      </div>
    </ScreenPanel>
  );
}
