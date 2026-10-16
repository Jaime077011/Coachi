"use client";

import { gymGroup, gymItemGroups, type ClientGym, type GymInput, type GymItem } from "@coachi/validation";
import { PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFmt } from "@/lib/format";

export const emptyGym: GymInput = { gym_name: null, items: [], custom_items: [], dumbbells_max_kg: null, note: null };

export const toGymInput = (gym: ClientGym | null): GymInput =>
  gym
    ? { gym_name: gym.gym_name, items: gym.items, custom_items: gym.custom_items, dumbbells_max_kg: gym.dumbbells_max_kg, note: gym.note }
    : emptyGym;

export function useGymItemLabel() {
  const t = useTranslations("gym");
  return (item: GymItem) => t(`item_${item}` as Parameters<typeof t>[0]);
}

/** Tick what the gym has, grouped like a gym floor. Used by the client (My gym) and the coach (client file). */
export function GymEditor({ value, onChange }: { value: GymInput; onChange: (next: GymInput) => void }) {
  const t = useTranslations("gym");
  const label = useGymItemLabel();
  const [custom, setCustom] = useState("");
  const set = (patch: Partial<GymInput>) => onChange({ ...value, ...patch });

  const addCustom = () => {
    const name = custom.trim();
    if (!name || value.custom_items.includes(name) || value.custom_items.length >= 30) return;
    set({ custom_items: [...value.custom_items, name.slice(0, 60)] });
    setCustom("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gym-name">{t("gymName")}</Label>
        <Input
          id="gym-name"
          value={value.gym_name ?? ""}
          maxLength={80}
          placeholder={t("gymNamePlaceholder")}
          onChange={(e) => set({ gym_name: e.target.value || null })}
        />
      </div>

      {gymGroup.options.map((group) => {
        const groupItems = gymItemGroups[group];
        return (
          <fieldset key={group} className="flex flex-col gap-2">
            <legend className="mb-2 text-xs font-bold tracking-[0.12em] text-hint uppercase">{t(`group_${group}`)}</legend>
            <ToggleGroup
              type="multiple"
              variant="outline"
              value={value.items.filter((i) => groupItems.includes(i))}
              onValueChange={(picked) =>
                set({ items: [...value.items.filter((i) => !groupItems.includes(i)), ...(picked as GymItem[])] })
              }
              className="w-full flex-wrap justify-start"
            >
              {groupItems.map((item) => (
                <ToggleGroupItem key={item} value={item} className="h-11 px-3 data-[state=on]:border-primary data-[state=on]:bg-primary/10">
                  {label(item)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {group === "free_weights" && value.items.includes("dumbbells") && (
              <div className="mt-2 flex flex-col gap-1.5">
                <Label htmlFor="gym-db-max">{t("dumbbellsMax")}</Label>
                <Input
                  id="gym-db-max"
                  dir="ltr"
                  inputMode="decimal"
                  className="tabular-nums"
                  value={value.dumbbells_max_kg ?? ""}
                  onChange={(e) => {
                    const n = Number(e.target.value.replace(",", "."));
                    set({ dumbbells_max_kg: e.target.value.trim() === "" || Number.isNaN(n) ? null : Math.min(n, 200) });
                  }}
                />
              </div>
            )}
          </fieldset>
        );
      })}

      <div className="flex flex-col gap-2">
        <Label htmlFor="gym-custom">{t("custom")}</Label>
        <div className="flex gap-2">
          <Input
            id="gym-custom"
            value={custom}
            maxLength={60}
            placeholder={t("customPlaceholder")}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={addCustom} disabled={!custom.trim()}>
            <PlusIcon data-icon="inline-start" />
            {t("addCustom")}
          </Button>
        </div>
        {value.custom_items.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {value.custom_items.map((name) => (
              <li key={name}>
                <Badge variant="secondary" className="h-9 gap-1 ps-3 pe-1 text-sm">
                  {name}
                  <button
                    type="button"
                    aria-label={t("removeCustom", { name })}
                    className="grid size-7 place-items-center rounded-full hover:bg-accent"
                    onClick={() => set({ custom_items: value.custom_items.filter((c) => c !== name) })}
                  >
                    <XIcon className="size-4" aria-hidden />
                  </button>
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gym-note">{t("note")}</Label>
        <Textarea
          id="gym-note"
          maxLength={500}
          placeholder={t("notePlaceholder")}
          value={value.note ?? ""}
          onChange={(e) => set({ note: e.target.value || null })}
        />
      </div>
    </div>
  );
}

/** Read-only view of a gym, for the coach: grouped items, extras, and the client's note. */
export function GymSummary({ gym }: { gym: ClientGym }) {
  const t = useTranslations("gym");
  const label = useGymItemLabel();
  const fmt = useFmt();
  return (
    <div className="flex flex-col gap-4">
      {gym.gym_name && <p className="font-semibold">{gym.gym_name}</p>}
      {gymGroup.options.map((group) => {
        const have = gymItemGroups[group].filter((i) => gym.items.includes(i));
        if (have.length === 0) return null;
        return (
          <div key={group} className="flex flex-col gap-2">
            <p className="text-xs text-hint">{t(`group_${group}`)}</p>
            <ul className="flex flex-wrap gap-1.5">
              {have.map((item) => (
                <li key={item}>
                  <Badge variant="secondary" className="text-sm">
                    {label(item)}
                    {item === "dumbbells" && gym.dumbbells_max_kg !== null && (
                      <span className="text-hint tabular-nums">· {t("upTo", { kg: fmt.kg(gym.dumbbells_max_kg) })}</span>
                    )}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {gym.custom_items.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-hint">{t("custom")}</p>
          <ul className="flex flex-wrap gap-1.5">
            {gym.custom_items.map((name) => (
              <li key={name}>
                <Badge variant="outline" className="text-sm">
                  {name}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
      {gym.note && <p className="rounded-md bg-secondary p-3 text-sm whitespace-pre-line">{gym.note}</p>}
    </div>
  );
}
