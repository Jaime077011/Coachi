"use client";

import { api } from "@coachi/core";
import type { Checkin, CheckinForm } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardListIcon, Loader2Icon, MessageCircleReplyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { QueryState } from "@/components/coachi/query-state";
import { EmptyState } from "@/components/coachi/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/hooks/use-session";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";

export function CheckinsTab({ clientId }: { clientId: string }) {
  const t = useTranslations("clientFile");
  const { coachId } = useMe();
  const list = useQuery({ queryKey: qk.checkins(clientId), queryFn: () => api.checkins.list(clientId) });
  const form = useQuery({ queryKey: qk.coachForm(coachId), queryFn: () => api.checkins.form(coachId), enabled: !!coachId });

  return (
    <QueryState query={list} isEmpty={(l) => l.length === 0} empty={<EmptyState icon={ClipboardListIcon} title={t("noCheckins")} />}>
      {(items) => (
        <ul className="flex flex-col gap-4">
          {items.map((c) => (
            <CheckinCard key={c.id} clientId={clientId} checkin={c} form={form.data ?? null} />
          ))}
        </ul>
      )}
    </QueryState>
  );
}

function CheckinCard({ clientId, checkin, form }: { clientId: string; checkin: Checkin; form: CheckinForm | null }) {
  const t = useTranslations("clientFile");
  const fmt = useFmt();
  const { coachId } = useMe();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: qk.checkins(clientId) });
    void queryClient.invalidateQueries({ queryKey: qk.coachToday(coachId) });
  };

  // Opening the tab marks new check-ins as read.
  const markRead = useMutation({ mutationFn: () => api.checkins.markRead(checkin.id), onSuccess: refresh });
  useEffect(() => {
    if (!checkin.read_at && markRead.isIdle) markRead.mutate();
  }, [checkin.read_at, markRead]);

  const send = useMutation({
    mutationFn: () => api.checkins.reply(checkin.id, reply.trim()),
    onSuccess: () => {
      setReply("");
      toast.success(t("replied"));
      refresh();
    },
  });

  const question = (id: string) => form?.questions.find((q) => q.id === id)?.text ?? id;
  const answer = (v: string | number | boolean) => (typeof v === "boolean" ? (v ? t("yes") : t("no")) : String(v));

  return (
    <li>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{fmt.date(checkin.created_at, "long")}</span>
            {!checkin.read_at && <Badge className="bg-info text-white">{t("unread")}</Badge>}
            {checkin.weight_kg != null && <span className="ms-auto font-stat text-2xl tabular-nums">{fmt.kg(checkin.weight_kg)}</span>}
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            {checkin.answers.map((a) => (
              <div key={a.question_id} className="flex flex-col gap-0.5">
                <dt className="text-xs text-hint">{question(a.question_id)}</dt>
                <dd className="font-semibold">{answer(a.value)}</dd>
              </div>
            ))}
          </dl>
          {checkin.note && <p className="rounded-md bg-secondary p-3 text-sm">{checkin.note}</p>}
          {checkin.coach_reply ? (
            <div className="flex gap-2 rounded-md border border-primary/30 p-3 text-sm">
              <MessageCircleReplyIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {checkin.coach_reply}
            </div>
          ) : (
            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (reply.trim()) send.mutate();
              }}
            >
              <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t("replyPlaceholder")} aria-label={t("sendReply")} />
              <Button type="submit" size="sm" className="w-fit" disabled={!reply.trim() || send.isPending}>
                {send.isPending && <Loader2Icon className="animate-spin" />}
                {t("sendReply")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </li>
  );
}
