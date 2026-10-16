"use client";

import { api } from "@coachi/core";
import type { AuditEntry } from "@coachi/validation";
import { useQuery } from "@tanstack/react-query";
import { ScrollTextIcon, SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenHeader } from "@/components/coachi/screen-header";
import { SortableTable, type Column } from "@/components/coachi/sortable-table";
import { EmptyState } from "@/components/coachi/states";
import { StatusChip } from "@/components/coachi/status-chip";
import { Input } from "@/components/ui/input";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";

/** Read only: every admin action and support-mode session. */
export function AuditScreen() {
  const t = useTranslations("admin.audit");
  const fmt = useFmt();
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const log = useQuery({ queryKey: qk.audit, queryFn: () => api.admin.auditLog() });

  const columns: Column<AuditEntry>[] = [
    { key: "when", header: t("col_when"), sortValue: (e) => e.created_at, cell: (e) => <span className="tabular-nums">{fmt.date(e.created_at)} · {fmt.time(e.created_at)}</span> },
    {
      key: "action",
      header: t("col_action"),
      sortValue: (e) => e.action,
      cell: (e) => (
        <span className="flex items-center gap-2">
          <code className="rounded bg-secondary px-1.5 py-0.5 text-xs" dir="ltr">
            {e.action}
          </code>
          {e.support_mode && <StatusChip tone="danger">{t("support")}</StatusChip>}
        </span>
      ),
    },
    { key: "target", header: t("col_target"), sortValue: (e) => e.target, cell: (e) => <bdi dir="ltr">{e.target}</bdi> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title={t("title")} className="mb-2" />
      <div className="flex flex-col gap-3">
        <div className="relative w-full">
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-hint" aria-hidden />
          <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="ps-10" />
        </div>
        <Input type="date" dir="ltr" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full" aria-label={t("col_when")} />
        <Input type="date" dir="ltr" value={to} onChange={(e) => setTo(e.target.value)} className="w-full" aria-label={t("col_when")} />
      </div>
      <QueryState query={log} isEmpty={(l) => l.length === 0} empty={<EmptyState icon={ScrollTextIcon} title={t("empty")} />}>
        {(rows) => {
          const shown = rows
            .filter((e) => !search || `${e.action} ${e.target}`.toLowerCase().includes(search.toLowerCase()))
            .filter((e) => (!from || e.created_at.slice(0, 10) >= from) && (!to || e.created_at.slice(0, 10) <= to));
          return <SortableTable label={t("title")} columns={columns} rows={shown} rowKey={(e) => e.id} defaultSort={{ key: "when", dir: "desc" }} />;
        }}
      </QueryState>
    </div>
  );
}
