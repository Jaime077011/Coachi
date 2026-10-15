"use client";

import { api } from "@coachi/core";
import type { ClientFile } from "@coachi/validation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MessageCircleHeartIcon, PinIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { SectionTitle } from "@/components/coachi/screen-header";
import { StatBlock } from "@/components/coachi/stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCan } from "@/hooks/use-can";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";

export function OverviewTab({ clientId, data }: { clientId: string; data: ClientFile }) {
  const t = useTranslations("clientFile");
  const fmt = useFmt();
  const progress = useQuery({ queryKey: qk.progress(clientId), queryFn: () => api.clients.progress(clientId) });
  const canEdit = useCan()("client_edit");
  const [word, setWord] = useState("");
  const pin = useMutation({
    mutationFn: () => api.journey.addCoachMessage(clientId, word.trim()),
    onSuccess: () => {
      setWord("");
      toast.success(t("coachWordSent"));
    },
  });

  const metrics = progress.data?.metrics ?? [];
  const start = data.details?.start_weight_kg ?? metrics[0]?.weight_kg ?? null;
  const current = metrics.at(-1)?.weight_kg ?? null;
  const change = start != null && current != null ? current - start : null;
  const pinned = data.notes.filter((n) => n.pinned);
  const latest = progress.data?.checkins.at(-1);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatBlock value={start != null ? fmt.num(start) : "—"} label={t("startWeight")} />
          <StatBlock
            value={current != null ? fmt.num(current) : "—"}
            label={t("currentWeight")}
            change={change != null ? { text: fmt.kg(change), good: (data.client.goal === "fat_loss") === change < 0 } : undefined}
          />
          <p className="col-span-2 self-end text-sm text-muted-foreground sm:col-span-1">{t("since", { date: fmt.date(data.started_at) })}</p>
        </CardContent>
      </Card>

      <section>
        <SectionTitle>{t("pinnedNotes")}</SectionTitle>
        {pinned.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noNotes")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pinned.map((n) => (
              <li key={n.id} className="flex gap-2 rounded-lg border bg-card p-3 text-sm">
                <PinIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {n.text}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionTitle>{t("latestCheckin")}</SectionTitle>
        {!latest ? (
          <p className="text-sm text-muted-foreground">{t("noCheckins")}</p>
        ) : (
          <Card>
            <CardContent className="flex flex-col gap-1 text-sm">
              <p className="font-semibold">
                {fmt.relative(latest.created_at)}
                {latest.weight_kg != null && <span className="text-muted-foreground"> · {fmt.kg(latest.weight_kg)}</span>}
              </p>
              {latest.note && <p className="text-muted-foreground">{latest.note}</p>}
            </CardContent>
          </Card>
        )}
      </section>

      {canEdit && (
        <section className="lg:col-span-2">
          <SectionTitle>{t("coachWord")}</SectionTitle>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (word.trim()) pin.mutate();
            }}
          >
            <Input value={word} onChange={(e) => setWord(e.target.value)} placeholder={t("coachWordPlaceholder")} aria-label={t("coachWord")} maxLength={300} />
            <Button type="submit" variant="secondary" disabled={!word.trim() || pin.isPending} aria-label={t("coachWord")}>
              <MessageCircleHeartIcon />
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}
