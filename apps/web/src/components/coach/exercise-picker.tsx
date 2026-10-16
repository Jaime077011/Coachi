"use client";

import { api } from "@coachi/core";
import { fitsGym, type ClientGym, type Exercise } from "@coachi/validation";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLocalName } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

export const EXERCISE_DRAG_TYPE = "application/x-coachi-exercise";

/**
 * Search the shared + own library. Tap to add; on laptop items can also be dragged into the day.
 * For a client's plan (`client` set), it shows only what fits his gym, with a switch to show everything.
 */
export function ExercisePicker({
  onPick,
  className,
  client,
}: {
  onPick: (exercise: Exercise) => void;
  className?: string;
  client?: { gym: ClientGym | null };
}) {
  const t = useTranslations("builder");
  const tLib = useTranslations("library");
  const tGym = useTranslations("gym");
  const name = useLocalName();
  const exercises = useQuery({ queryKey: qk.exercises, queryFn: () => api.training.exercises() });
  const [onlyGym, setOnlyGym] = useState(true);
  const gym = client?.gym ?? null;
  const filtering = !!gym && onlyGym;

  const byMuscle = new Map<string, Exercise[]>();
  for (const e of exercises.data ?? []) {
    if (filtering && !fitsGym(e, gym)) continue;
    byMuscle.set(e.muscle, [...(byMuscle.get(e.muscle) ?? []), e]);
  }

  return (
    <Command
      className={className}
      // Search both languages whatever the screen language.
      filter={(value, search) => (value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}
    >
      {client &&
        (gym ? (
          <div className="flex min-h-11 items-center justify-between gap-3 border-b px-3">
            <Label htmlFor="only-gym" className="text-sm font-normal">
              {tGym("onlyHisGym")}
            </Label>
            <Switch id="only-gym" checked={onlyGym} onCheckedChange={setOnlyGym} />
          </div>
        ) : (
          <p className="border-b px-3 py-2 text-xs text-hint">{tGym("noGymYet")}</p>
        ))}
      <CommandInput placeholder={t("searchExercises")} />
      <CommandList className="max-h-none">
        <CommandEmpty>{t("noExercise")}</CommandEmpty>
        {[...byMuscle.entries()].map(([muscle, list]) => (
          <CommandGroup key={muscle} heading={tLib(`muscle_${muscle}` as Parameters<typeof tLib>[0])}>
            {list.map((e) => {
              const missing = !!gym && !fitsGym(e, gym);
              return (
                <CommandItem
                  key={e.id}
                  value={`${e.name_en} ${e.name_ar}`}
                  onSelect={() => onPick(e)}
                  className="min-h-11 cursor-grab gap-2"
                  draggable
                  onDragStart={(ev) => ev.dataTransfer.setData(EXERCISE_DRAG_TYPE, e.id)}
                >
                  <span className={cn("flex-1", missing && "text-muted-foreground")}>{name(e)}</span>
                  <span className={cn("text-xs", missing ? "text-warning" : "text-hint")}>
                    {missing ? tGym("notInGym") : tLib(`eq_${e.equipment}` as Parameters<typeof tLib>[0])}
                  </span>
                  <PlusIcon className="size-4 text-primary" aria-hidden />
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}
