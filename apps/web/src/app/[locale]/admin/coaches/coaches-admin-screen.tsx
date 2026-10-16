"use client";

import { api } from "@coachi/core";
import type { AdminCoachRow, SubscriptionStatus } from "@coachi/validation";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon, SearchXIcon, UserPlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenHeader } from "@/components/coachi/screen-header";
import { SortableTable, type Column } from "@/components/coachi/sortable-table";
import { EmptyState } from "@/components/coachi/states";
import { StatusChip } from "@/components/coachi/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useRouter } from "@/i18n/navigation";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { subscriptionTone } from "@/lib/subscription-tone";

const statuses: (SubscriptionStatus | "all")[] = ["all", "trial", "active", "ending_soon", "expired", "paused"];

export function CoachesAdminScreen() {
  const t = useTranslations("admin.coaches");
  const tSub = useTranslations("subscription");
  const fmt = useFmt();
  const [status, setStatus] = useState<SubscriptionStatus | "all">("all");
  const [search, setSearch] = useState("");
  const router = useRouter();
  const coaches = useQuery({ queryKey: qk.adminCoaches, queryFn: () => api.admin.coaches() });

  const chip = (c: AdminCoachRow) => <StatusChip tone={subscriptionTone[c.status]}>{tSub(`status_${c.status}`)}</StatusChip>;
  const columns: Column<AdminCoachRow>[] = [
    { key: "name", header: t("col_name"), sortValue: (c) => c.name, cell: (c) => <bdi className="font-semibold">{c.name}</bdi> },
    { key: "phone", header: t("col_phone"), cell: (c) => <span dir="ltr" className="tabular-nums">{c.phone}</span> },
    { key: "seats", header: t("col_seats"), sortValue: (c) => c.client_seats, cell: (c) => <span className="tabular-nums">{t("seatsCell", { clients: c.client_seats, team: c.team_seats })}</span> },
    { key: "clients", header: t("col_clients"), sortValue: (c) => c.client_count, cell: (c) => <span className="tabular-nums">{fmt.num(c.client_count)}</span> },
    { key: "status", header: t("col_status"), sortValue: (c) => c.status, cell: chip },
    { key: "end", header: t("col_end"), sortValue: (c) => c.ends_at, cell: (c) => <span className="tabular-nums">{fmt.date(c.ends_at, "short")}</span> },
    { key: "active", header: t("col_active"), sortValue: (c) => c.last_active_at, cell: (c) => (c.last_active_at ? fmt.relative(c.last_active_at) : "—") },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader
        title={t("title")}
        className="mb-2"
        action={
          <Button asChild>
            <Link href="/admin/coaches/new">
              <UserPlusIcon data-icon="inline-start" />
              {t("add")}
            </Link>
          </Button>
        }
      />
      <div className="flex flex-col gap-3">
        <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <TabsList className="w-full overflow-x-auto">
            {statuses.map((s) => (
              <TabsTrigger key={s} value={s}>
                {s === "all" ? t("all") : tSub(`status_${s}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full">
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-hint" aria-hidden />
          <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="ps-10" />
        </div>
      </div>
      <QueryState query={coaches}>
        {(rows) => {
          const shown = rows
            .filter((c) => status === "all" || c.status === status)
            .filter((c) => !search || `${c.name} ${c.phone}`.toLowerCase().includes(search.toLowerCase()));
          if (shown.length === 0)
            return (
              <EmptyState
                icon={SearchXIcon}
                title={t("noResults")}
                action={
                  <Button variant="secondary" onClick={() => (setStatus("all"), setSearch(""))}>
                    {t("clearFilters")}
                  </Button>
                }
              />
            );
          return (
            <>
              <ul className="flex flex-col gap-2 lg:hidden">
                {shown.map((c) => (
                  <li key={c.coach_id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/coaches/${c.coach_id}`)}
                      className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-start hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <div className="min-w-0 flex-1">
                        <bdi className="block truncate font-semibold">{c.name}</bdi>
                        <p className="text-xs text-hint">
                          {t("seatsCell", { clients: c.client_seats, team: c.team_seats })} · {fmt.num(c.client_count)} · {fmt.date(c.ends_at, "short")}
                        </p>
                      </div>
                      {chip(c)}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="hidden lg:block">
                <SortableTable label={t("title")} columns={columns} rows={shown} rowKey={(c) => c.coach_id} onRowClick={(c) => router.push(`/admin/coaches/${c.coach_id}`)} defaultSort={{ key: "end", dir: "asc" }} />
              </div>
            </>
          );
        }}
      </QueryState>
    </div>
  );
}
