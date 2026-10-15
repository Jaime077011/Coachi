"use client";

import { api } from "@coachi/core";
import type { DirectoryFilters, Goal } from "@coachi/validation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { SearchIcon, SearchXIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeferredValue, useState } from "react";
import { CoachCard } from "@/components/coachi/coach-card";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenHeader } from "@/components/coachi/screen-header";
import { EmptyState } from "@/components/coachi/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Toggle } from "@/components/ui/toggle";
import { qk } from "@/lib/query-keys";

const goals: Goal[] = ["fat_loss", "muscle", "strength", "health"];

/** All active, approved coaches. Home screen for a client with no coach yet. */
export function CoachesScreen() {
  const t = useTranslations("coaches");
  const tParts = useTranslations("parts");
  const [search, setSearch] = useState("");
  const [goal, setGoal] = useState<Goal | undefined>();
  const [mode, setMode] = useState<DirectoryFilters["mode"]>();
  const [women, setWomen] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const filters: DirectoryFilters = {
    search: deferredSearch || undefined,
    goal,
    mode,
    women_coaches: women || undefined,
  };
  const list = useQuery({
    queryKey: qk.directory(filters),
    queryFn: () => api.directory.list(filters),
    placeholderData: keepPreviousData,
  });
  const hasFilters = !!(search || goal || mode || women);
  const clear = () => {
    setSearch("");
    setGoal(undefined);
    setMode(undefined);
    setWomen(false);
  };

  const chip = "h-9 shrink-0 rounded-full border px-3 text-sm font-semibold data-[state=on]:border-primary data-[state=on]:bg-primary/12 data-[state=on]:text-primary";

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title={t("title")} className="mb-2" />
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-hint" aria-hidden />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search")}
          aria-label={t("search")}
          className="ps-10"
        />
      </div>

      <ScrollArea className="-mx-4 w-auto">
        <div className="flex gap-2 px-4 pb-3" role="group" aria-label={t("filters")}>
          {goals.map((g) => (
            <Toggle key={g} pressed={goal === g} onPressedChange={(on) => setGoal(on ? g : undefined)} className={chip}>
              {tParts(`goalName.${g}`)}
            </Toggle>
          ))}
          <Toggle pressed={mode === "online"} onPressedChange={(on) => setMode(on ? "online" : undefined)} className={chip}>
            {t("online")}
          </Toggle>
          <Toggle pressed={mode === "in_person"} onPressedChange={(on) => setMode(on ? "in_person" : undefined)} className={chip}>
            {t("inPerson")}
          </Toggle>
          <Toggle pressed={women} onPressedChange={setWomen} className={chip}>
            {t("women")}
          </Toggle>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <QueryState
        query={list}
        isEmpty={(d) => d.length === 0}
        empty={
          <EmptyState
            icon={SearchXIcon}
            title={t("noResults")}
            action={
              hasFilters && (
                <Button variant="secondary" onClick={clear}>
                  {t("clearFilters")}
                </Button>
              )
            }
          />
        }
      >
        {(coaches) => (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t("count", { count: coaches.length })}
            </p>
            {coaches.map((c) => (
              <CoachCard key={c.id} coach={c} href={`/app/coaches/${c.id}`} />
            ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}
