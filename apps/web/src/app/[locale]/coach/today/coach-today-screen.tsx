"use client";

import { api } from "@coachi/core";
import type { CoachToday } from "@coachi/validation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRightIcon,
  ClipboardPlusIcon,
  DumbbellIcon,
  HandHeartIcon,
  InboxIcon,
  PartyPopperIcon,
  UserPlusIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { AddClientDialog } from "@/components/coach/add-client-dialog";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenHeader, SectionTitle } from "@/components/coachi/screen-header";
import { EmptyState } from "@/components/coachi/states";
import { StatusChip, type Tone } from "@/components/coachi/status-chip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCan } from "@/hooks/use-can";
import { useMe } from "@/hooks/use-session";
import { Link } from "@/i18n/navigation";
import { useFmt } from "@/lib/format";
import { initials } from "@/lib/initials";
import { qk } from "@/lib/query-keys";

const reasonTone: Record<CoachToday["needs_attention"][number]["reason"], Tone> = {
  missed_workouts: "danger",
  plan_ending: "warning",
  unread_checkin: "info",
  request_waiting: "warning",
};

export function CoachTodayScreen() {
  const t = useTranslations("coachToday");
  const { coachId } = useMe();
  const [adding, setAdding] = useState(false);
  const can = useCan();
  const newPlan = can("plans_edit") && (
    <Button variant="secondary" asChild>
      <Link href="/coach/plans">
        <ClipboardPlusIcon data-icon="inline-start" />
        {t("newPlan")}
      </Link>
    </Button>
  );
  const addClient = can("clients_invite") && (
    <Button onClick={() => setAdding(true)}>
      <UserPlusIcon data-icon="inline-start" />
      {t("addClient")}
    </Button>
  );
  const today = useQuery({ queryKey: qk.coachToday(coachId), queryFn: () => api.clients.coachToday(coachId), enabled: !!coachId });

  return (
    <div className="flex flex-col gap-8">
      <ScreenHeader
        title={t("title")}
        className="mb-0"
        action={
          <div className="hidden gap-2 sm:flex">
            {newPlan}
            {addClient}
          </div>
        }
      />
      {(addClient || newPlan) && (
        <div className="grid auto-cols-fr grid-flow-col gap-2 sm:hidden">
          {addClient}
          {newPlan}
        </div>
      )}

      <QueryState query={today}>
        {(data) => (
          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <SectionTitle>{t("attention")}</SectionTitle>
              {data.new_requests > 0 && (
                <Link href="/coach/requests" className="mb-3 block rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                  <Card className="border-primary/40">
                    <CardContent className="flex items-center gap-3">
                      <InboxIcon className="size-5 text-primary" aria-hidden />
                      <span className="flex-1 font-semibold">{t("newRequests", { count: data.new_requests })}</span>
                      <ChevronRightIcon className="size-5 text-hint rtl:rotate-180" aria-hidden />
                    </CardContent>
                  </Card>
                </Link>
              )}
              {data.needs_attention.length === 0 ? (
                <EmptyState icon={PartyPopperIcon} title={t("allClear")} />
              ) : (
                <ul className="divide-y rounded-lg border bg-card">
                  {data.needs_attention.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 p-3">
                      <Avatar className="size-10">
                        <AvatarFallback className="bg-secondary text-sm font-bold">{initials(item.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate font-semibold">
                          <bdi>{item.name}</bdi>
                        </span>
                        <StatusChip tone={reasonTone[item.reason]}>{t(`reason_${item.reason}`, { count: item.detail ?? 0 })}</StatusChip>
                      </div>
                      <Button asChild variant="secondary" size="sm">
                        <Link
                          href={
                            item.request_id
                              ? "/coach/requests"
                              : `/coach/clients/${item.client_id}${item.reason === "unread_checkin" ? "?tab=checkins" : ""}`
                          }
                        >
                          {item.reason === "unread_checkin" || item.reason === "request_waiting" ? t("reply") : t("open")}
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <SectionTitle>{t("activity")}</SectionTitle>
              {data.activity.length === 0 ? (
                <EmptyState icon={DumbbellIcon} title={t("noActivity")} />
              ) : (
                <ul className="divide-y rounded-lg border bg-card">
                  {data.activity.map((a, i) => (
                    <ActivityRow key={i} item={a} />
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </QueryState>

      <AddClientDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}

function ActivityRow({ item }: { item: CoachToday["activity"][number] }) {
  const t = useTranslations("coachToday");
  const fmt = useFmt();
  const [sent, setSent] = useState(false);
  const verb = item.kind === "workout" ? t("loggedWorkout") : item.kind === "meals" ? t("loggedMeals") : t("sentCheckin");
  return (
    <li className="flex items-center gap-3 p-3">
      <Avatar className="size-10">
        <AvatarFallback className="bg-secondary text-sm font-bold">{initials(item.name)}</AvatarFallback>
      </Avatar>
      <Link href={`/coach/clients/${item.client_id}`} className="min-w-0 flex-1 hover:underline">
        <p className="truncate text-sm">
          <bdi className="font-semibold">{item.name}</bdi> {verb}
        </p>
        <p className="text-xs text-hint">{fmt.relative(item.at)} · {fmt.time(item.at)}</p>
      </Link>
      <Button
        variant={sent ? "ghost" : "secondary"}
        size="sm"
        disabled={sent}
        onClick={() => {
          setSent(true);
          toast.success(t("niceWorkSent", { name: item.name.split(" ")[0]! }));
        }}
      >
        <HandHeartIcon data-icon="inline-start" />
        {t("niceWork")}
      </Button>
    </li>
  );
}
