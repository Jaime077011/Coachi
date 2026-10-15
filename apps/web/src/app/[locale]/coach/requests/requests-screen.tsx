"use client";

import { api } from "@coachi/core";
import type { CoachRequest } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, InboxIcon, Loader2Icon, MessageCircleIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { QueryState } from "@/components/coachi/query-state";
import { ResponsiveDialog } from "@/components/coachi/responsive-dialog";
import { ScreenHeader } from "@/components/coachi/screen-header";
import { EmptyState } from "@/components/coachi/states";
import { StatusChip } from "@/components/coachi/status-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/hooks/use-session";
import { Link } from "@/i18n/navigation";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { whatsappUrl } from "@/lib/whatsapp";

export function RequestsScreen() {
  const t = useTranslations("requests");
  const { coachId } = useMe();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"new" | "answered">("new");
  const [declining, setDeclining] = useState<CoachRequest | null>(null);
  const [reply, setReply] = useState("");
  const inbox = useQuery({ queryKey: qk.inbox(coachId), queryFn: () => api.directory.inbox(coachId), enabled: !!coachId });

  const answer = useMutation({
    mutationFn: ({ request, accept, reply }: { request: CoachRequest; accept: boolean; reply?: string }) =>
      api.directory.answer(request.id, accept, reply),
    onSuccess: (_d, { request, accept }) => {
      toast.success(accept ? t("accepted", { name: request.client_name }) : t("declined"));
      for (const key of [qk.inbox(coachId), qk.clients(coachId), qk.coachToday(coachId)]) void queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title={t("title")} className="mb-2" />
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="new">{t("new")}</TabsTrigger>
          <TabsTrigger value="answered">{t("answered")}</TabsTrigger>
        </TabsList>
      </Tabs>
      <QueryState
        query={inbox}
        isEmpty={(rows) => rows.filter((r) => (tab === "new" ? r.status === "sent" : r.status !== "sent")).length === 0}
        empty={
          <EmptyState
            icon={InboxIcon}
            title={t("emptyTitle")}
            body={tab === "new" ? t("emptyBody") : undefined}
            action={
              tab === "new" && (
                <Button asChild variant="secondary">
                  <Link href="/coach/profile">{t("editProfile")}</Link>
                </Button>
              )
            }
          />
        }
      >
        {(rows) => (
          <ul className="grid gap-3 lg:grid-cols-2">
            {rows
              .filter((r) => (tab === "new" ? r.status === "sent" : r.status !== "sent"))
              .map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  busy={answer.isPending && answer.variables?.request.id === r.id}
                  onAccept={() => answer.mutate({ request: r, accept: true })}
                  onDecline={() => {
                    setReply("");
                    setDeclining(r);
                  }}
                />
              ))}
          </ul>
        )}
      </QueryState>

      <ResponsiveDialog
        open={!!declining}
        onOpenChange={(open) => !open && setDeclining(null)}
        title={t("declineTitle", { name: declining?.client_name ?? "" })}
        description={t("declineBody")}
        footer={
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={() => {
              answer.mutate({ request: declining!, accept: false, reply: reply.trim() || undefined });
              setDeclining(null);
            }}
          >
            {t("decline")}
          </Button>
        }
      >
        <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t("declinePlaceholder")} aria-label={t("declineTitle", { name: "" })} maxLength={300} />
      </ResponsiveDialog>
    </div>
  );
}

function RequestCard({ request: r, busy, onAccept, onDecline }: { request: CoachRequest; busy: boolean; onAccept: () => void; onDecline: () => void }) {
  const t = useTranslations("requests");
  const tParts = useTranslations("parts");
  const fmt = useFmt();
  return (
    <li>
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[17px] font-semibold">
                <bdi>{r.client_name}</bdi>
              </p>
              <p className="text-xs text-hint">{t("received", { when: fmt.relative(r.created_at) })}</p>
            </div>
            {r.status !== "sent" && (
              <StatusChip tone={r.status === "accepted" ? "success" : "neutral"}>{t(`status_${r.status}`)}</StatusChip>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-xs text-hint">{t("goal")}</dt>
              <dd className="font-semibold">{tParts(`goalName.${r.goal}`)}</dd>
            </div>
            <div>
              <dt className="text-xs text-hint">{t("contact")}</dt>
              <dd className="font-semibold">{t(`contact_${r.contact_by}`)}</dd>
            </div>
          </dl>
          {r.message && <p className="rounded-md bg-secondary p-3 text-sm">{r.message}</p>}
          {r.reply && <p className="text-sm text-muted-foreground">↳ {r.reply}</p>}
          {r.status === "sent" && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={onAccept} disabled={busy}>
                {busy ? <Loader2Icon className="animate-spin" /> : <CheckIcon data-icon="inline-start" />}
                {t("accept")}
              </Button>
              <Button variant="secondary" onClick={onDecline} disabled={busy}>
                <XIcon data-icon="inline-start" />
                {t("decline")}
              </Button>
              {r.client_phone && (
                <Button asChild variant="ghost">
                  <a href={whatsappUrl(r.client_phone)} target="_blank" rel="noreferrer">
                    <MessageCircleIcon data-icon="inline-start" />
                    {t("whatsapp")}
                  </a>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </li>
  );
}
