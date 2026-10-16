"use client";

import { api } from "@coachi/core";
import type { GymInput } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { GymEditor, toGymInput } from "@/components/coachi/gym-editor";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenHeader } from "@/components/coachi/screen-header";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-session";
import { useApiErrorToast } from "@/lib/api-error";
import { qk } from "@/lib/query-keys";

/** The client lists what his gym has, so his coach only plans exercises he can do there. */
export function GymScreen() {
  const t = useTranslations("gym");
  const { clientId } = useMe();
  const gym = useQuery({ queryKey: qk.clientGym(clientId), queryFn: () => api.clients.gym(clientId), enabled: !!clientId });
  return (
    <div className="flex flex-col">
      <ScreenHeader title={t("title")} subtitle={t("intro")} back="/app/me" />
      <QueryState query={gym}>{(data) => <GymForm clientId={clientId} initial={toGymInput(data)} />}</QueryState>
    </div>
  );
}

function GymForm({ clientId, initial }: { clientId: string; initial: GymInput }) {
  const t = useTranslations("gym");
  const queryClient = useQueryClient();
  const showError = useApiErrorToast();
  const [value, setValue] = useState(initial);
  const save = useMutation({
    mutationFn: () => api.clients.saveGym(clientId, value),
    onSuccess: (saved) => {
      queryClient.setQueryData(qk.clientGym(clientId), saved);
      toast.success(t("saved"));
    },
    onError: showError,
  });

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <GymEditor value={value} onChange={setValue} />
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] -mx-4 border-t bg-background px-4 py-3">
        <Button type="submit" className="w-full" disabled={save.isPending}>
          {save.isPending && <Loader2Icon className="animate-spin" />}
          {t("save")} · {t("count", { n: value.items.length + value.custom_items.length })}
        </Button>
      </div>
    </form>
  );
}
