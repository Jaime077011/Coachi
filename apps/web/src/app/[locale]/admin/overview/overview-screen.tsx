"use client";

import { api } from "@coachi/core";
import type { AdminCoachRow } from "@coachi/validation";
import { useQuery } from "@tanstack/react-query";
import { CalendarClockIcon, MessageCircleIcon, ReceiptIcon, UserPlusIcon, UsersRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { CoachLeads } from "@/components/admin/coach-leads";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenHeader } from "@/components/coachi/screen-header";
import { EmptyState } from "@/components/coachi/states";
import { StatBlock } from "@/components/coachi/stats";
import { StatusChip } from "@/components/coachi/status-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { subscriptionTone } from "@/lib/subscription-tone";
import { whatsappUrl } from "@/lib/whatsapp";

export function OverviewScreen() {
  const t = useTranslations("admin.overview");
  const tSub = useTranslations("subscription");
  const tPay = useTranslations("admin.payment");
  const tCoaches = useTranslations("admin.coaches");
  const tLeads = useTranslations("admin.leads");
  const fmt = useFmt();
  const overview = useQuery({ queryKey: qk.adminOverview, queryFn: () => api.admin.overview() });

  const row = (c: AdminCoachRow, action?: React.ReactNode) => (
    <li key={c.coach_id} className="flex items-center gap-3 p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">
          <bdi>{c.name}</bdi>
        </p>
        <p className="text-xs text-hint">
          {c.plan_name} · {t("clients", { count: c.client_count })} · {fmt.date(c.ends_at, "short")}
        </p>
      </div>
      <StatusChip tone={subscriptionTone[c.status]}>{tSub(`status_${c.status}`)}</StatusChip>
      {action}
    </li>
  );

  return (
    <div className="flex flex-col gap-6">
      <ScreenHeader
        title={t("title")}
        className="mb-0"
        action={
          <div className="hidden gap-2 sm:flex">
            <Button asChild variant="secondary">
              <Link href="/admin/payments/new">
                <ReceiptIcon data-icon="inline-start" />
                {tPay("title")}
              </Link>
            </Button>
            <Button asChild>
              <Link href={{ pathname: "/admin/coaches/new", query: { back: "/admin/overview" } }}>
                <UserPlusIcon data-icon="inline-start" />
                {tCoaches("add")}
              </Link>
            </Button>
          </div>
        }
      />
      <QueryState
        query={overview}
        isEmpty={(o) => o.active_coaches === 0 && o.newest.length === 0}
        empty={
          <EmptyState
            icon={UsersRoundIcon}
            title={t("emptyTitle")}
            action={
              <Button asChild>
                <Link href={{ pathname: "/admin/coaches/new", query: { back: "/admin/overview" } }}>
                  <UserPlusIcon data-icon="inline-start" />
                  {t("emptyTitle")}
                </Link>
              </Button>
            }
          />
        }
      >
        {(o) => (
          <>
            <Card>
              <CardContent className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                <StatBlock value={fmt.num(o.active_coaches)} label={t("activeCoaches")} />
                <StatBlock value={fmt.num(o.total_clients)} label={t("totalClients")} />
                <StatBlock value={fmt.num(o.workouts_this_week)} label={t("workoutsWeek")} />
                <StatBlock value={fmt.num(o.ending_in_7_days)} label={t("ending7")} />
              </CardContent>
            </Card>
            <Tabs defaultValue="ending">
              <TabsList className="w-full overflow-x-auto">
                <TabsTrigger value="ending">{t("endingSoon")}</TabsTrigger>
                <TabsTrigger value="newest">{t("newest")}</TabsTrigger>
                <TabsTrigger value="requests">{tLeads("title")}</TabsTrigger>
              </TabsList>
              <TabsContent value="ending" className="mt-4">
                {o.ending_soon.length === 0 ? (
                  <EmptyState icon={CalendarClockIcon} title={t("noneEnding")} />
                ) : (
                  <ul className="divide-y rounded-lg border bg-card">
                    {o.ending_soon.map((c) =>
                      row(
                        c,
                        c.phone && (
                          <Button asChild size="sm" variant="secondary">
                            <a
                              href={whatsappUrl(c.phone, t("remindMessage", { name: c.name, date: fmt.date(c.ends_at, "long") }))}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MessageCircleIcon data-icon="inline-start" />
                              {t("remind")}
                            </a>
                          </Button>
                        ),
                      ),
                    )}
                  </ul>
                )}
              </TabsContent>
              <TabsContent value="newest" className="mt-4">
                <ul className="divide-y rounded-lg border bg-card">{o.newest.map((c) => row(c))}</ul>
              </TabsContent>
              <TabsContent value="requests" className="mt-4">
                <CoachLeads />
              </TabsContent>
            </Tabs>
          </>
        )}
      </QueryState>
    </div>
  );
}
