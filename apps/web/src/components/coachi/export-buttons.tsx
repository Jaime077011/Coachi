"use client";

import { api, type ClientExportRow } from "@coachi/core";
import { useMutation } from "@tanstack/react-query";
import { DownloadIcon, Loader2Icon } from "lucide-react";
import { gymItem, type GymItem } from "@coachi/validation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useGymItemLabel } from "@/components/coachi/gym-editor";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-session";
import { useApiErrorToast } from "@/lib/api-error";
import { datedName, downloadFile, toCsv } from "@/lib/download";
import { useFmt } from "@/lib/format";

/** Client, from Me: one JSON file with everything the app keeps about him. */
export function ExportMyDataButton() {
  const t = useTranslations("export");
  const { clientId } = useMe();
  const showError = useApiErrorToast();
  const run = useMutation({
    mutationFn: () => api.clients.exportMine(clientId),
    onSuccess: (data) => {
      downloadFile(datedName("coachi-my-data", "json"), JSON.stringify(data, null, 2), "application/json");
      toast.success(t("done"));
    },
    onError: showError,
  });
  return (
    <Button variant="secondary" className="justify-start" disabled={!clientId || run.isPending} onClick={() => run.mutate()}>
      {run.isPending ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <DownloadIcon data-icon="inline-start" />}
      {t("mine")}
    </Button>
  );
}

const columns = [
  "name", "phone", "status", "goal", "started_at", "assigned_to", "age", "gender", "height_cm", "start_weight_kg",
  "latest_weight_kg", "target_weight_kg", "training_days", "place", "gym_name", "gym_items", "injuries", "health_notes",
  "medicines", "food_likes", "food_dislikes", "food_never", "meals_per_day", "workouts_done", "last_workout_at", "notes",
] as const satisfies readonly (keyof ClientExportRow)[];

/** Coach, from Settings: a spreadsheet of every client file he may see. */
export function ExportClientsButton() {
  const t = useTranslations("export");
  const tParts = useTranslations("parts");
  const tIntake = useTranslations("intake");
  const tClients = useTranslations("clients");
  const fmt = useFmt();
  const gymLabel = useGymItemLabel();
  const { coachId } = useMe();
  const showError = useApiErrorToast();

  const value = (row: ClientExportRow, col: (typeof columns)[number]): unknown => {
    const v = row[col];
    if (v === null) return "";
    switch (col) {
      case "status":
        return tClients(`status_${row.status}`);
      case "goal":
        return row.goal ? tParts(`goalName.${row.goal}`) : "";
      case "gender":
        return row.gender ? tIntake(row.gender) : "";
      case "place":
        return row.place ? tIntake(row.place === "gym" ? "placeGym" : row.place === "home" ? "placeHome" : "placeBoth") : "";
      case "gym_items":
        // Catalog keys get their names; machines he typed himself stay as written.
        return row.gym_items.map((i) => (gymItem.safeParse(i).success ? gymLabel(i as GymItem) : i));
      case "training_days":
        return row.training_days.map((d) => fmt.weekday(`2026-10-${String(11 + d).padStart(2, "0")}`)).join(" ");
      case "started_at":
      case "last_workout_at":
        return row[col] ? row[col]!.slice(0, 10) : "";
      default:
        return v;
    }
  };

  const run = useMutation({
    mutationFn: () => api.clients.exportClients(coachId),
    onSuccess: (rows) => {
      const csv = toCsv(
        columns.map((c) => t(`col_${c}`)),
        rows.map((r) => columns.map((c) => value(r, c))),
      );
      downloadFile(datedName("coachi-clients", "csv"), csv, "text/csv;charset=utf-8");
      toast.success(t("doneClients", { count: rows.length }));
    },
    onError: showError,
  });
  return (
    <Button variant="secondary" className="justify-start" disabled={!coachId || run.isPending} onClick={() => run.mutate()}>
      {run.isPending ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <DownloadIcon data-icon="inline-start" />}
      {t("clients")}
    </Button>
  );
}
