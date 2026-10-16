"use client";

import { api } from "@coachi/core";
import type { DirectoryQueueItem } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, EyeIcon, EyeOffIcon, HourglassIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { CoachCard } from "@/components/coachi/coach-card";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenHeader } from "@/components/coachi/screen-header";
import { EmptyState } from "@/components/coachi/states";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { qk } from "@/lib/query-keys";

type Tab = "waiting" | "listed" | "hidden";

export function DirectoryAdminScreen() {
  const t = useTranslations("admin.directory");
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("waiting");
  const queue = useQuery({ queryKey: qk.directoryQueue, queryFn: () => api.admin.directoryQueue() });

  const act = useMutation({
    mutationFn: async ({ id, listed, featured }: { id: string; listed?: boolean; featured?: boolean }) => {
      if (listed !== undefined) await api.admin.setListed(id, listed);
      if (featured !== undefined) await api.admin.setFeatured(id, featured);
    },
    onSuccess: (_d, v) => {
      if (v.listed === true) toast.success(t("approved"));
      if (v.listed === false) toast(t("hiddenToast"));
      void queryClient.invalidateQueries({ queryKey: qk.directoryQueue });
      void queryClient.invalidateQueries({ queryKey: qk.audit });
    },
  });

  // "Waiting" = never approved and not hidden on purpose; in mock data, not listed and still open.
  const bucket = (i: DirectoryQueueItem): Tab => (i.profile.listed ? "listed" : i.profile.open_for_clients ? "waiting" : "hidden");

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title={t("title")} className="mb-2" />
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="waiting">{t("waiting")}</TabsTrigger>
          <TabsTrigger value="listed">{t("listed")}</TabsTrigger>
          <TabsTrigger value="hidden">{t("hidden")}</TabsTrigger>
        </TabsList>
      </Tabs>
      <QueryState
        query={queue}
        isEmpty={(items) => !items.some((i) => bucket(i) === tab)}
        empty={<EmptyState icon={HourglassIcon} title={t("queueEmpty")} />}
      >
        {(items) => (
          <ul className="flex flex-col gap-4">
            {items
              .filter((i) => bucket(i) === tab)
              .map((i) => (
                <li key={i.profile.id} className="flex flex-col gap-3 rounded-lg border bg-card p-3">
                  <CoachCard coach={i.profile} className="border-0 p-1 shadow-none" />
                  <div className="flex flex-wrap items-center gap-3 border-t pt-3 text-sm">
                    <span className="text-muted-foreground">
                      {t("replyRate")}:{" "}
                      <span className="font-semibold text-foreground tabular-nums">
                        {i.requests_total ? t("requests", { accepted: i.requests_accepted, total: i.requests_total }) : t("noRequests")}
                      </span>
                    </span>
                    <div className="ms-auto flex items-center gap-2">
                      {tab === "listed" && (
                        <label className="flex items-center gap-2">
                          <Switch checked={i.profile.featured} onCheckedChange={(on) => act.mutate({ id: i.profile.id, featured: on })} />
                          {t("featured")}
                        </label>
                      )}
                      {tab === "waiting" && (
                        <Button size="sm" onClick={() => act.mutate({ id: i.profile.id, listed: true })}>
                          <CheckIcon data-icon="inline-start" />
                          {t("approve")}
                        </Button>
                      )}
                      {tab === "hidden" ? (
                        <Button size="sm" variant="secondary" onClick={() => act.mutate({ id: i.profile.id, listed: true })}>
                          <EyeIcon data-icon="inline-start" />
                          {t("show")}
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => act.mutate({ id: i.profile.id, listed: false })}>
                          <EyeOffIcon data-icon="inline-start" />
                          {t("hide")}
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </QueryState>
    </div>
  );
}
