"use client";

import { api } from "@coachi/core";
import type { ClientStatus, ClientSummary } from "@coachi/validation";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon, SearchXIcon, UserPlusIcon, UsersRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AddClientDialog } from "@/components/coach/add-client-dialog";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenHeader } from "@/components/coachi/screen-header";
import { SortableTable, type Column } from "@/components/coachi/sortable-table";
import { EmptyState } from "@/components/coachi/states";
import { AdherenceBar } from "@/components/coachi/stats";
import { StatusChip, type Tone } from "@/components/coachi/status-chip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMe } from "@/hooks/use-session";
import { Link, useRouter } from "@/i18n/navigation";
import { useFmt } from "@/lib/format";
import { initials } from "@/lib/initials";
import { qk } from "@/lib/query-keys";

type Filter = "active" | "paused" | "attention" | "all";

const statusTone: Record<ClientStatus, Tone> = { invited: "info", active: "success", paused: "neutral", archived: "neutral" };

export function ClientsScreen() {
  const t = useTranslations("clients");
  const tParts = useTranslations("parts");
  const tAdd = useTranslations("addClient");
  const fmt = useFmt();
  const router = useRouter();
  const { coachId } = useMe();
  const [filter, setFilter] = useState<Filter>("active");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const list = useQuery({ queryKey: qk.clients(coachId), queryFn: () => api.clients.list(coachId), enabled: !!coachId });

  const visible = (rows: ClientSummary[]) =>
    rows
      .filter((c) =>
        filter === "all" ? true : filter === "attention" ? c.needs_attention : filter === "active" ? c.status === "active" || c.status === "invited" : c.status === "paused",
      )
      .filter((c) => !search || c.name.toLowerCase().includes(search.trim().toLowerCase()));

  const lastWorkout = (c: ClientSummary) => (c.last_workout_at ? fmt.relative(c.last_workout_at) : t("never"));
  const status = (c: ClientSummary) =>
    c.needs_attention ? (
      <StatusChip tone="warning">{t("attention")}</StatusChip>
    ) : (
      <StatusChip tone={statusTone[c.status]}>{t(`status_${c.status}`)}</StatusChip>
    );

  const columns: Column<ClientSummary>[] = [
    {
      key: "name",
      header: t("col_name"),
      sortValue: (c) => c.name,
      cell: (c) => (
        <span className="flex items-center gap-3">
          <ClientAvatar c={c} />
          <span className="flex flex-col">
            <bdi className="font-semibold">{c.name}</bdi>
            {status(c)}
          </span>
        </span>
      ),
    },
    { key: "goal", header: t("col_goal"), sortValue: (c) => c.goal, cell: (c) => (c.goal ? tParts(`goalName.${c.goal}`) : "—") },
    { key: "plan", header: t("col_plan"), sortValue: (c) => c.plan_name, cell: (c) => c.plan_name ?? <span className="text-hint">{t("noPlan")}</span> },
    {
      key: "week",
      header: t("col_week"),
      sortValue: (c) => (c.adherence_planned ? c.adherence_done / c.adherence_planned : -1),
      cell: (c) => <AdherenceBar done={c.adherence_done} planned={c.adherence_planned} />,
    },
    { key: "last", header: t("col_last"), sortValue: (c) => c.last_workout_at, cell: (c) => <span className="tabular-nums">{lastWorkout(c)}</span> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader
        title={t("title")}
        className="mb-2"
        action={
          <Button onClick={() => setAdding(true)} className="max-sm:size-12 max-sm:px-0" aria-label={tAdd("title")}>
            <UserPlusIcon data-icon="inline-start" />
            <span className="max-sm:sr-only">{tAdd("title")}</span>
          </Button>
        }
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="w-full overflow-x-auto lg:w-auto">
            {(["active", "attention", "paused", "all"] as const).map((f) => (
              <TabsTrigger key={f} value={f} className="flex-1 lg:flex-none">
                {t(`tab_${f}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative lg:w-72">
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-hint" aria-hidden />
          <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="ps-10" />
        </div>
      </div>

      <QueryState
        query={list}
        isEmpty={(rows) => rows.length === 0}
        empty={
          <EmptyState
            icon={UsersRoundIcon}
            title={t("emptyTitle")}
            action={
              <Button onClick={() => setAdding(true)}>
                <UserPlusIcon data-icon="inline-start" />
                {tAdd("title")}
              </Button>
            }
          />
        }
      >
        {(rows) => {
          const shown = visible(rows);
          if (shown.length === 0) return <EmptyState icon={SearchXIcon} title={t("emptyFiltered")} />;
          return (
            <>
              {/* Phone and tablet: list */}
              <ul className="flex flex-col gap-2 lg:hidden">
                {shown.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/coach/clients/${c.id}`}
                      className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <ClientAvatar c={c} />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <bdi className="truncate font-semibold">{c.name}</bdi>
                          <span className="shrink-0 text-xs text-hint">{lastWorkout(c)}</span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.goal ? tParts(`goalName.${c.goal}`) : "—"} · {c.plan_name ?? t("noPlan")}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <AdherenceBar done={c.adherence_done} planned={c.adherence_planned} />
                          {status(c)}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              {/* Laptop: sortable table */}
              <div className="hidden lg:block">
                <SortableTable
                  label={t("title")}
                  columns={columns}
                  rows={shown}
                  rowKey={(c) => c.id}
                  onRowClick={(c) => router.push(`/coach/clients/${c.id}`)}
                  defaultSort={{ key: "name", dir: "asc" }}
                />
              </div>
            </>
          );
        }}
      </QueryState>

      <AddClientDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}

function ClientAvatar({ c }: { c: ClientSummary }) {
  return (
    <Avatar className="size-11">
      {c.avatar_url && <AvatarImage src={c.avatar_url} alt="" />}
      <AvatarFallback className="bg-secondary text-sm font-bold">{initials(c.name)}</AvatarFallback>
    </Avatar>
  );
}
