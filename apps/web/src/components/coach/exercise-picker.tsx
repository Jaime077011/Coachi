"use client";

import { api } from "@coachi/core";
import type { Exercise } from "@coachi/validation";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useLocalName } from "@/lib/format";
import { qk } from "@/lib/query-keys";

export const EXERCISE_DRAG_TYPE = "application/x-coachi-exercise";

/** Search the shared + own library. Tap to add; on laptop items can also be dragged into the day. */
export function ExercisePicker({ onPick, className }: { onPick: (exercise: Exercise) => void; className?: string }) {
  const t = useTranslations("builder");
  const tLib = useTranslations("library");
  const name = useLocalName();
  const exercises = useQuery({ queryKey: qk.exercises, queryFn: () => api.training.exercises() });

  const byMuscle = new Map<string, Exercise[]>();
  for (const e of exercises.data ?? []) byMuscle.set(e.muscle, [...(byMuscle.get(e.muscle) ?? []), e]);

  return (
    <Command
      className={className}
      // Search both languages whatever the screen language.
      filter={(value, search) => (value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}
    >
      <CommandInput placeholder={t("searchExercises")} />
      <CommandList className="max-h-none">
        <CommandEmpty>{t("noExercise")}</CommandEmpty>
        {[...byMuscle.entries()].map(([muscle, list]) => (
          <CommandGroup key={muscle} heading={tLib(`muscle_${muscle}` as Parameters<typeof tLib>[0])}>
            {list.map((e) => (
              <CommandItem
                key={e.id}
                value={`${e.name_en} ${e.name_ar}`}
                onSelect={() => onPick(e)}
                className="min-h-11 cursor-grab gap-2"
                draggable
                onDragStart={(ev) => ev.dataTransfer.setData(EXERCISE_DRAG_TYPE, e.id)}
              >
                <span className="flex-1">{name(e)}</span>
                <span className="text-xs text-hint">{tLib(`eq_${e.equipment}` as Parameters<typeof tLib>[0])}</span>
                <PlusIcon className="size-4 text-primary" aria-hidden />
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}
