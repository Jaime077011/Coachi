"use client";

import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Present = the column can be sorted by this value. */
  sortValue?: (row: T) => string | number | null;
  className?: string;
};

/** Laptop data table: click a header to sort. Small lists only (sorting happens in the browser). */
export function SortableTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  defaultSort,
  label,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  defaultSort?: { key: string; dir: "asc" | "desc" };
  label: string;
}) {
  const [sort, setSort] = useState(defaultSort ?? null);
  const column = columns.find((c) => c.key === sort?.key);
  const sorted =
    column?.sortValue && sort
      ? [...rows].sort((a, b) => {
          const va = column.sortValue!(a);
          const vb = column.sortValue!(b);
          if (va === vb) return 0;
          if (va === null) return 1;
          if (vb === null) return -1;
          const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
          return sort.dir === "asc" ? cmp : -cmp;
        })
      : rows;

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table aria-label={label}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((c) => {
              const active = sort?.key === c.key;
              const Icon = !active ? ArrowUpDownIcon : sort!.dir === "asc" ? ArrowUpIcon : ArrowDownIcon;
              return (
                <TableHead
                  key={c.key}
                  className={cn("h-11 text-start text-xs font-bold text-hint", c.className)}
                  aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                >
                  {c.sortValue ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={() =>
                        setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" } : { key: c.key, dir: "asc" }))
                      }
                    >
                      {c.header}
                      <Icon className="size-3.5" aria-hidden />
                    </button>
                  ) : (
                    c.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => (
            <TableRow
              key={rowKey(row)}
              className={cn(onRowClick && "cursor-pointer")}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c) => (
                <TableCell key={c.key} className={cn("py-3", c.className)}>
                  {c.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
