"use client";

import { api } from "@coachi/core";
import type { CoachLeadStatus } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { InboxIcon, MessageCircleIcon, UserPlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { QueryState } from "@/components/coachi/query-state";
import { EmptyState } from "@/components/coachi/states";
import { StatusChip, type Tone } from "@/components/coachi/status-chip";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { whatsappUrl } from "@/lib/whatsapp";

const tone: Record<CoachLeadStatus, Tone> = { new: "info", contacted: "warning", added: "success", dismissed: "neutral" };

/** Coaches who asked to join from the home page: WhatsApp them, then add them (prefilled) or dismiss. */
export function CoachLeads() {
  const t = useTranslations("admin.leads");
  const fmt = useFmt();
  const queryClient = useQueryClient();
  const leads = useQuery({ queryKey: qk.coachLeads, queryFn: () => api.admin.coachLeads() });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CoachLeadStatus }) => api.admin.setLeadStatus(id, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk.coachLeads }),
  });

  return (
    <section aria-label={t("title")}>
      <QueryState
        query={leads}
        isEmpty={(list) => list.every((l) => l.status === "added" || l.status === "dismissed")}
        empty={<EmptyState icon={InboxIcon} title={t("empty")} body={t("emptyBody")} />}
      >
        {(list) => (
          <ul className="divide-y rounded-lg border bg-card">
            {list
              .filter((l) => l.status === "new" || l.status === "contacted")
              .map((l) => (
                <li key={l.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      <bdi>{l.name}</bdi>
                      <StatusChip tone={tone[l.status]}>{t(`status_${l.status}`)}</StatusChip>
                    </p>
                    <p className="text-xs text-hint">
                      <bdi dir="ltr">{l.phone}</bdi>
                      {l.city && <> · {l.city}</>} · {t(`clients_${l.clients_count}`)} · {fmt.relative(l.created_at)}
                    </p>
                    {l.message && <p className="text-sm whitespace-pre-line text-muted-foreground">{l.message}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="secondary">
                      <a
                        href={whatsappUrl(l.phone, t("whatsappMessage", { name: l.name }))}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => l.status === "new" && setStatus.mutate({ id: l.id, status: "contacted" })}
                      >
                        <MessageCircleIcon data-icon="inline-start" />
                        {t("whatsapp")}
                      </a>
                    </Button>
                    <Button asChild size="sm">
                      <Link href={{ pathname: "/admin/coaches/new", query: { name: l.name, phone: l.phone, lead: l.id, back: "/admin/overview" } }}>
                        <UserPlusIcon data-icon="inline-start" />
                        {t("add")}
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" aria-label={t("dismiss")} title={t("dismiss")} onClick={() => setStatus.mutate({ id: l.id, status: "dismissed" })}>
                      <XIcon />
                    </Button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </QueryState>
    </section>
  );
}
