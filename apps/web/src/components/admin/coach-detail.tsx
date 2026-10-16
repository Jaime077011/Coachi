"use client";

import { api } from "@coachi/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlusIcon, EyeIcon, Loader2Icon, PauseIcon, PlayIcon, ReceiptIcon, Trash2Icon, UserRoundXIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenHeader } from "@/components/coachi/screen-header";
import { ScreenPanel } from "@/components/coachi/screen-panel";
import { EmptyState } from "@/components/coachi/states";
import { StatusChip } from "@/components/coachi/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Link, useRouter } from "@/i18n/navigation";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { subscriptionTone } from "@/lib/subscription-tone";
import { useSupportMode } from "./support-mode";

function useCoach(coachId: string) {
  return useQuery({
    queryKey: qk.adminCoaches,
    queryFn: () => api.admin.coaches(),
    select: (rows) => rows.find((c) => c.coach_id === coachId) ?? null,
  });
}

function useCoachActions() {
  const t = useTranslations("admin.panel");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orgId, coachId, action }: { orgId: string; coachId: string; action: "extend" | "pause" | "resume" | "delete" | { client_seats: number; team_seats: number } }) => {
      if (action === "extend") await api.admin.extend(orgId, 7);
      else if (action === "pause") await api.admin.setStatus(orgId, "paused");
      else if (action === "resume") await api.admin.setStatus(orgId, "active");
      else if (action === "delete") await api.admin.deleteCoach(coachId);
      else await api.admin.setSeats(orgId, action);
    },
    onSuccess: (_d, { action }) => {
      for (const key of [qk.adminCoaches, qk.adminOverview, qk.audit]) void queryClient.invalidateQueries({ queryKey: key });
      toast.success(
        action === "extend" ? t("extended") : action === "pause" ? t("paused") : action === "resume" ? t("resumed") : action === "delete" ? t("deleted") : t("seatsChanged"),
      );
    },
  });
}

/** /admin/coaches/<id>: details, payments, notes, and the actions. Full width, one section under another. */
export function CoachDetail({ coachId }: { coachId: string }) {
  const t = useTranslations("admin.panel");
  const tSub = useTranslations("subscription");
  const tParts = useTranslations("parts");
  const fmt = useFmt();
  const { start } = useSupportMode();
  const coach = useCoach(coachId);
  const act = useCoachActions();
  const self = `/admin/coaches/${coachId}`;

  return (
    <QueryState query={coach}>
      {(c) =>
        !c ? (
          <EmptyState icon={UserRoundXIcon} title={t("notFound")} action={<Button asChild variant="secondary"><Link href="/admin/coaches">{t("backToCoaches")}</Link></Button>} />
        ) : (
          <div className="flex flex-col gap-6">
            <ScreenHeader
              title={<bdi>{c.name}</bdi>}
              subtitle={
                <span className="flex items-center gap-2">
                  <StatusChip tone={subscriptionTone[c.status]}>{tSub(`status_${c.status}`)}</StatusChip>
                  <span>{t("seatsSummary", { clients: c.client_seats, team: c.team_seats })}</span>
                </span>
              }
              back="/admin/coaches"
              className="mb-0"
            />

            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={{ pathname: "/admin/payments/new", query: { org: c.org_id, back: self } }}>
                  <ReceiptIcon data-icon="inline-start" />
                  {t("recordPayment")}
                </Link>
              </Button>
              <Button variant="secondary" disabled={act.isPending} onClick={() => act.mutate({ orgId: c.org_id, coachId: c.coach_id, action: "extend" })}>
                <CalendarPlusIcon data-icon="inline-start" />
                {t("extend")}
              </Button>
              {c.status === "paused" ? (
                <Button variant="secondary" onClick={() => act.mutate({ orgId: c.org_id, coachId: c.coach_id, action: "resume" })}>
                  <PlayIcon data-icon="inline-start" />
                  {t("resume")}
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => act.mutate({ orgId: c.org_id, coachId: c.coach_id, action: "pause" })}>
                  <PauseIcon data-icon="inline-start" />
                  {t("pause")}
                </Button>
              )}
              <Button asChild variant="secondary">
                <Link href={`/admin/coaches/${c.coach_id}/seats`}>
                  <UsersIcon data-icon="inline-start" />
                  {t("changeSeats")}
                </Link>
              </Button>
              <Button variant="secondary" onClick={() => void start(c.coach_id, c.name)}>
                <EyeIcon data-icon="inline-start" />
                {t("support")}
              </Button>
            </div>

            <Tabs defaultValue="details">
              <TabsList className="w-full">
                <TabsTrigger value="details">{t("details")}</TabsTrigger>
                <TabsTrigger value="payments">{t("payments")}</TabsTrigger>
                <TabsTrigger value="notes">{t("notes")}</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="mt-4">
                <dl className="flex flex-col divide-y rounded-lg border bg-card">
                  <Fact label={t("phone")}>
                    <span dir="ltr">{c.phone ?? "—"}</span>
                  </Fact>
                  <Fact label={t("clientSeats")}>
                    <span className="tabular-nums">{t("seatsUsed", { used: c.client_count, seats: c.client_seats })}</span>
                  </Fact>
                  <Fact label={t("teamSeats")}>
                    <span className="tabular-nums">{fmt.num(c.team_seats)}</span>
                  </Fact>
                  <Fact label={t("ends")}>{fmt.date(c.ends_at)}</Fact>
                  <Fact label={t("listed")}>{c.listed ? t("yes") : t("no")}</Fact>
                </dl>
              </TabsContent>
              <TabsContent value="payments" className="mt-4">
                <Payments orgId={c.org_id} empty={t("noPayments")} methodLabel={(m) => tParts(`paymentMethod.${m}`)} seatsLabel={(clients, team) => t("seatsSummary", { clients, team })} />
              </TabsContent>
              <TabsContent value="notes" className="mt-4">
                <CoachNotes coachId={c.coach_id} placeholder={t("notesPlaceholder")} label={t("notes")} />
              </TabsContent>
            </Tabs>

            <div className="border-t pt-6">
              <Button asChild variant="destructive">
                <Link href={`/admin/coaches/${c.coach_id}/delete`}>
                  <Trash2Icon data-icon="inline-start" />
                  {t("delete")}
                </Link>
              </Button>
            </div>
          </div>
        )
      }
    </QueryState>
  );
}

function Payments({
  orgId,
  empty,
  methodLabel,
  seatsLabel,
}: {
  orgId: string;
  empty: string;
  methodLabel: (m: "instapay" | "cash" | "bank" | "vodafone_cash") => string;
  seatsLabel: (clients: number, team: number) => string;
}) {
  const fmt = useFmt();
  const payments = useQuery({ queryKey: qk.payments(orgId), queryFn: () => api.billing.payments(orgId) });
  if (!payments.data?.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="divide-y rounded-lg border bg-card text-sm">
      {payments.data.map((p) => (
        <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
          <span>{fmt.date(p.paid_at)}</span>
          {p.client_seats !== null && <span className="text-hint">{seatsLabel(p.client_seats, p.team_seats ?? 0)}</span>}
          <span className="text-hint">{methodLabel(p.method)}</span>
          <span className="font-semibold tabular-nums">{fmt.egp(p.amount_piasters)}</span>
        </li>
      ))}
    </ul>
  );
}

/** /admin/coaches/<id>/delete: can't be undone the normal way, so it asks you to type the name. */
export function DeleteCoach({ coachId }: { coachId: string }) {
  const t = useTranslations("admin.panel");
  const router = useRouter();
  const coach = useCoach(coachId);
  const act = useCoachActions();
  const [confirmName, setConfirmName] = useState("");
  return (
    <QueryState query={coach}>
      {(c) =>
        !c ? (
          <EmptyState icon={UserRoundXIcon} title={t("notFound")} />
        ) : (
          <ScreenPanel
            back={`/admin/coaches/${coachId}`}
            title={t("deleteTitle", { name: c.name })}
            description={t("deleteBody")}
            footer={
              <Button
                variant="destructive"
                disabled={confirmName.trim() !== c.name.trim() || act.isPending}
                onClick={() =>
                  act.mutate({ orgId: c.org_id, coachId: c.coach_id, action: "delete" }, { onSuccess: () => router.push("/admin/coaches") })
                }
              >
                <Trash2Icon data-icon="inline-start" />
                {t("delete")}
              </Button>
            }
          >
            <Input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} placeholder={t("deleteConfirm")} aria-label={t("deleteConfirm")} />
          </ScreenPanel>
        )
      }
    </QueryState>
  );
}

/** /admin/coaches/<id>/seats: change seats without a payment (e.g. a few extra clients until he renews). */
export function ChangeSeats({ coachId }: { coachId: string }) {
  const t = useTranslations("admin.panel");
  const router = useRouter();
  const coach = useCoach(coachId);
  const act = useCoachActions();
  const [clients, setClients] = useState<string | null>(null);
  const [team, setTeam] = useState<string | null>(null);
  const toInt = (v: string) => Math.max(0, Math.round(Number(v)) || 0);
  return (
    <QueryState query={coach}>
      {(c) =>
        !c ? (
          <EmptyState icon={UserRoundXIcon} title={t("notFound")} />
        ) : (
          <ScreenPanel
            back={`/admin/coaches/${coachId}`}
            title={t("changeSeats")}
            description={t("changeSeatsBody", { name: c.name })}
            footer={
              <Button
                disabled={act.isPending}
                onClick={() =>
                  act.mutate(
                    { orgId: c.org_id, coachId: c.coach_id, action: { client_seats: toInt(clients ?? String(c.client_seats)), team_seats: toInt(team ?? String(c.team_seats)) } },
                    { onSuccess: () => router.push(`/admin/coaches/${coachId}`) },
                  )
                }
              >
                {act.isPending && <Loader2Icon className="animate-spin" />}
                {t("saveSeats")}
              </Button>
            }
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="seats-clients">{t("clientSeats")}</Label>
              <Input id="seats-clients" dir="ltr" inputMode="numeric" className="tabular-nums" value={clients ?? String(c.client_seats)} onChange={(e) => setClients(e.target.value)} />
              <p className="text-xs text-hint">{t("seatsUsed", { used: c.client_count, seats: c.client_seats })}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="seats-team">{t("teamSeats")}</Label>
              <Input id="seats-team" dir="ltr" inputMode="numeric" className="tabular-nums" value={team ?? String(c.team_seats)} onChange={(e) => setTeam(e.target.value)} />
            </div>
          </ScreenPanel>
        )
      }
    </QueryState>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 text-sm">
      <dt className="text-hint">{label}</dt>
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
