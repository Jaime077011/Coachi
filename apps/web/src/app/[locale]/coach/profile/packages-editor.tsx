"use client";

import { MAX_PACKAGES, type CoachPackage, type PackageInput } from "@coachi/validation";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

/** Editable form of a package: numbers and the "included" list as typed text. */
export type PackageDraft = { key: string; id?: string; name: string; egp: string; weeks: string; includes: string; highlighted: boolean };

export const toDraft = (p: CoachPackage): PackageDraft => ({
  key: p.id,
  id: p.id,
  name: p.name,
  egp: String(p.price_piasters / 100),
  weeks: String(p.weeks),
  includes: p.includes.join("\n"),
  highlighted: p.highlighted,
});

/** Drafts → what the API saves. Empty names are dropped; numbers are clamped to their range. */
export const fromDrafts = (drafts: PackageDraft[]): PackageInput[] =>
  drafts
    .filter((d) => d.name.trim())
    .map((d) => ({
      id: d.id,
      name: d.name.trim().slice(0, 60),
      price_piasters: Math.max(0, Math.round((Number(d.egp) || 0) * 100)),
      weeks: Math.min(52, Math.max(1, Math.round(Number(d.weeks) || 4))),
      includes: d.includes
        .split("\n")
        .map((line) => line.trim().slice(0, 80))
        .filter(Boolean)
        .slice(0, 8),
      highlighted: d.highlighted,
    }));

/** What the coach sells, up to MAX_PACKAGES. Only one can be "Most popular". The title comes from the section around it. */
export function PackagesEditor({ drafts, onChange }: { drafts: PackageDraft[]; onChange: (next: PackageDraft[]) => void }) {
  const t = useTranslations("landing");
  const update = (i: number, patch: Partial<PackageDraft>) =>
    onChange(
      drafts.map((d, j) => {
        if (j === i) return { ...d, ...patch };
        // Turning one package "Most popular" turns the others off.
        return patch.highlighted ? { ...d, highlighted: false } : d;
      }),
    );
  const move = (i: number, by: -1 | 1) => {
    const next = [...drafts];
    [next[i], next[i + by]] = [next[i + by]!, next[i]!];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      {drafts.map((d, i) => (
        <fieldset key={d.key} className="flex flex-col gap-3 rounded-lg border bg-background p-4 has-[[role=switch][data-state=checked]]:border-primary">
          <legend className="sr-only">{d.name || t("packageN", { n: i + 1 })}</legend>
          <p aria-hidden className="text-xs font-bold tracking-[0.12em] text-hint uppercase">
            {t("packageN", { n: i + 1 })}
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`pk-name-${d.key}`}>{t("packageName")}</Label>
            <Input id={`pk-name-${d.key}`} dir="auto" maxLength={60} value={d.name} onChange={(e) => update(i, { name: e.target.value })} placeholder={t("packageNamePlaceholder")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`pk-price-${d.key}`}>{t("packagePrice")}</Label>
              <Input id={`pk-price-${d.key}`} dir="ltr" inputMode="numeric" value={d.egp} onChange={(e) => update(i, { egp: e.target.value.replace(/[^\d.]/g, "") })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`pk-weeks-${d.key}`}>{t("packageWeeks")}</Label>
              <Input id={`pk-weeks-${d.key}`} dir="ltr" inputMode="numeric" value={d.weeks} onChange={(e) => update(i, { weeks: e.target.value.replace(/\D/g, "") })} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`pk-inc-${d.key}`}>{t("packageIncludes")}</Label>
            <Textarea id={`pk-inc-${d.key}`} value={d.includes} onChange={(e) => update(i, { includes: e.target.value })} className="min-h-24" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <Switch checked={d.highlighted} onCheckedChange={(on) => update(i, { highlighted: on })} />
              {t("popular")}
            </label>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="icon" disabled={i === 0} onClick={() => move(i, -1)} aria-label={t("moveUp")}>
                <ArrowUpIcon />
              </Button>
              <Button type="button" variant="ghost" size="icon" disabled={i === drafts.length - 1} onClick={() => move(i, 1)} aria-label={t("moveDown")}>
                <ArrowDownIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => onChange(drafts.filter((_, j) => j !== i))}
                aria-label={t("removePackage")}
              >
                <Trash2Icon />
              </Button>
            </div>
          </div>
        </fieldset>
      ))}
      {drafts.length < MAX_PACKAGES && (
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full border-2 border-dashed"
          onClick={() => onChange([...drafts, { key: crypto.randomUUID(), name: "", egp: "", weeks: "4", includes: "", highlighted: false }])}
        >
          <PlusIcon data-icon="inline-start" />
          {t("addPackage")}
        </Button>
      )}
    </div>
  );
}
