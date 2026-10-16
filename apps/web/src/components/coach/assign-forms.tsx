"use client";

import { api } from "@coachi/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ClipboardListIcon, DumbbellIcon, Loader2Icon, UtensilsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { ScreenPanel } from "@/components/coachi/screen-panel";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useMe } from "@/hooks/use-session";
import { useApiErrorToast } from "@/lib/api-error";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

export type PlanKind = "workout" | "nutrition";

function useAssign(kind: PlanKind) {
  const { coachId } = useMe();
  const queryClient = useQueryClient();
  const showError = useApiErrorToast();
  return useMutation({
    onError: showError,
    mutationFn: async ({ planId, clientIds }: { planId: string; clientIds: string[] }) => {
      if (kind === "workout") await api.training.assign(planId, clientIds);
      else await api.nutrition.assign(planId, clientIds);
    },
    onSuccess: (_d, { clientIds }) => {
      void queryClient.invalidateQueries({ queryKey: qk.programs(coachId) });
      void queryClient.invalidateQueries({ queryKey: qk.nutritionPlans(coachId) });
      void queryClient.invalidateQueries({ queryKey: qk.clients(coachId) });
      for (const id of clientIds) {
        void queryClient.invalidateQueries({ queryKey: qk.clientProgram(id) });
        void queryClient.invalidateQueries({ queryKey: qk.clientFile(id) });
      }
    },
  });
}

/** One template → many clients (each gets an editable copy). Its own screen: /coach/plans/<kind>/<id>/assign. */
export function AssignToClientsForm({
  kind,
  plan,
  back,
  onDone,
}: {
  kind: PlanKind;
  plan: { id: string; name: string };
  back: string;
  onDone: () => void;
}) {
  const t = useTranslations("plans");
  const { coachId } = useMe();
  const [picked, setPicked] = useState<string[]>([]);
  const clients = useQuery({ queryKey: qk.clients(coachId), queryFn: () => api.clients.list(coachId), enabled: !!coachId });
  const assign = useAssign(kind);

  return (
    <ScreenPanel
      back={back}
      title={t("assignTitle", { name: plan.name })}
      description={t("assignBody")}
      footer={
        <Button
          disabled={picked.length === 0 || assign.isPending}
          onClick={() =>
            assign.mutate(
              { planId: plan.id, clientIds: picked },
              {
                onSuccess: () => {
                  toast.success(t("assigned", { count: picked.length }));
                  onDone();
                },
              },
            )
          }
        >
          {assign.isPending && <Loader2Icon className="animate-spin" />}
          {t("assignTo", { count: picked.length })}
        </Button>
      }
    >
      <Command className="rounded-lg border">
        <CommandInput placeholder={t("searchClients")} />
        <CommandList className="max-h-none">
          <CommandEmpty>—</CommandEmpty>
          {(clients.data ?? []).map((c) => {
            const on = picked.includes(c.id);
            return (
              <CommandItem
                key={c.id}
                value={c.name}
                onSelect={() => setPicked((p) => (on ? p.filter((x) => x !== c.id) : [...p, c.id]))}
                className="min-h-11 gap-3"
                aria-selected={on}
              >
                <span className={cn("grid size-5 place-items-center rounded-sm border", on && "border-primary bg-primary text-primary-foreground")}>
                  {on && <CheckIcon className="size-3.5" />}
                </span>
                <bdi className="flex-1">{c.name}</bdi>
                {c.plan_name && <span className="text-xs text-hint">{c.plan_name}</span>}
              </CommandItem>
            );
          })}
        </CommandList>
      </Command>
    </ScreenPanel>
  );
}

/** Client file: pick a template for this one client. Its own screen: /coach/clients/<id>/assign. */
export function AssignTemplateForm({ clientId, back, onDone }: { clientId: string; back: string; onDone: () => void }) {
  const t = useTranslations("plans");
  const tFile = useTranslations("clientFile");
  const { coachId } = useMe();
  const programs = useQuery({ queryKey: qk.programs(coachId), queryFn: () => api.training.programs(coachId), enabled: !!coachId });
  const nutrition = useQuery({ queryKey: qk.nutritionPlans(coachId), queryFn: () => api.nutrition.plans(coachId), enabled: !!coachId });
  const assignWorkout = useAssign("workout");
  const assignNutrition = useAssign("nutrition");

  const templates = [
    ...(programs.data ?? []).filter((p) => p.client_id === null).map((p) => ({ id: p.id, name: p.name, kind: "workout" as const })),
    ...(nutrition.data ?? []).filter((p) => p.client_id === null).map((p) => ({ id: p.id, name: p.name, kind: "nutrition" as const })),
  ];

  return (
    <ScreenPanel back={back} title={tFile("assignPlan")} description={t("assignBody")}>
      {templates.length === 0 ? (
        <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <ClipboardListIcon className="size-5" aria-hidden />
          {t("noTemplates")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2 pb-2">
          {templates.map((tpl) => {
            const Icon = tpl.kind === "workout" ? DumbbellIcon : UtensilsIcon;
            const mutation = tpl.kind === "workout" ? assignWorkout : assignNutrition;
            return (
              <li key={tpl.id}>
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() =>
                    mutation.mutate(
                      { planId: tpl.id, clientIds: [clientId] },
                      {
                        onSuccess: () => {
                          toast.success(t("assigned", { count: 1 }));
                          onDone();
                        },
                      },
                    )
                  }
                  className="flex min-h-12 w-full items-center gap-3 rounded-md border bg-card px-3 text-start hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Icon className="size-5 text-muted-foreground" aria-hidden />
                  <span className="flex-1 font-semibold">{tpl.name}</span>
                  <span className="text-xs text-hint">{tpl.kind === "workout" ? t("workout") : t("nutrition")}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </ScreenPanel>
  );
}
