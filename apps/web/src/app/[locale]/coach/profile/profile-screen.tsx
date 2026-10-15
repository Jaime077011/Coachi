"use client";

import { api, ApiError } from "@coachi/core";
import { coachingMode, slug as slugSchema, specialty, type CoachPackage, type CoachProfile } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HourglassIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { CoachCard } from "@/components/coachi/coach-card";
import { PackageCard } from "@/components/coachi/package-card";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenHeader, SectionTitle } from "@/components/coachi/screen-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useMe } from "@/hooks/use-session";
import { qk } from "@/lib/query-keys";
import { LandingSettings } from "./landing-settings";
import { PackagesEditor, fromDrafts, toDraft, type PackageDraft } from "./packages-editor";

export function ProfileScreen() {
  const t = useTranslations("profile");
  const { coachId } = useMe();
  const profile = useQuery({ queryKey: qk.coachProfile(coachId), queryFn: () => api.directory.myProfile(coachId), enabled: !!coachId });
  const packages = useQuery({ queryKey: qk.coachPackages(coachId), queryFn: () => api.directory.myPackages(coachId), enabled: !!coachId });
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title={t("title")} />
      <QueryState query={profile}>
        {(p) => (
          <QueryState query={packages}>
            {(list) => <ProfileForm initial={p} initialPackages={list} />}
          </QueryState>
        )}
      </QueryState>
    </div>
  );
}

function ProfileForm({ initial, initialPackages }: { initial: CoachProfile; initialPackages: CoachPackage[] }) {
  const t = useTranslations("profile");
  const tParts = useTranslations("parts");
  const tCp = useTranslations("coachPage");
  const queryClient = useQueryClient();
  const [p, setP] = useState(initial);
  const [certs, setCerts] = useState(initial.certificates.join(", "));
  const [drafts, setDrafts] = useState<PackageDraft[]>(() => initialPackages.map(toDraft));
  const [savedSlug, setSavedSlug] = useState(initial.slug);
  const [slugError, setSlugError] = useState<"invalid" | "taken" | null>(null);
  const set = <K extends keyof CoachProfile>(key: K, value: CoachProfile[K]) => setP((x) => ({ ...x, [key]: value }));
  const egp = (piasters: number | null) => (piasters == null ? "" : String(piasters / 100));
  const toPiasters = (v: string) => (v.trim() === "" ? null : Math.round(Number(v) * 100) || null);

  const save = useMutation({
    mutationFn: async () => {
      const saved = await api.directory.updateProfile(p.id, {
        ...p,
        certificates: certs.split(/[,،]/).map((c) => c.trim()).filter(Boolean),
      });
      const packages = await api.directory.savePackages(p.id, fromDrafts(drafts));
      return { saved, packages };
    },
    onSuccess: ({ saved, packages }) => {
      toast.success(t("saved"));
      setSavedSlug(saved.slug);
      setDrafts(packages.map(toDraft));
      queryClient.setQueryData(qk.coachPackages(p.id), packages);
      void queryClient.invalidateQueries({ queryKey: qk.coachProfile(p.id) });
      void queryClient.invalidateQueries({ queryKey: qk.landing(saved.slug) });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.message === "slug_taken") setSlugError("taken");
      else toast.error(t("saveFailed"));
    },
  });

  const submit = () => {
    if (!slugSchema.safeParse(p.slug).success) {
      setSlugError("invalid");
      document.getElementById("slug")?.focus();
      return;
    }
    setSlugError(null);
    save.mutate();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <LandingSettings
          value={p}
          savedSlug={savedSlug}
          slugError={slugError}
          onChange={(patch) => {
            if ("slug" in patch) setSlugError(null);
            setP((x) => ({ ...x, ...patch }));
          }}
        />

        {!p.listed && (
          <p className="flex gap-2 rounded-lg bg-info/12 p-3 text-sm text-info">
            <HourglassIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t("waiting")}
          </p>
        )}

        <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
          <div>
            <Label htmlFor="open" className="text-[15px] font-semibold">
              {t("open")}
            </Label>
            <p className="text-sm text-muted-foreground">{t("openBody")}</p>
          </div>
          <Switch id="open" checked={p.open_for_clients} onCheckedChange={(v) => set("open_for_clients", v)} />
        </div>

        <F id="name" label={t("name")}>
          <Input id="name" value={p.name} onChange={(e) => set("name", e.target.value)} />
        </F>
        <F id="bio" label={t("bio")}>
          <Textarea id="bio" maxLength={600} value={p.bio} onChange={(e) => set("bio", e.target.value)} className="min-h-28" />
        </F>
        <div className="flex flex-col gap-2">
          <Label>{t("specialties")}</Label>
          <ToggleGroup
            type="multiple"
            variant="outline"
            value={p.specialties}
            onValueChange={(v) => set("specialties", v as CoachProfile["specialties"])}
            className="flex w-full flex-wrap justify-start"
          >
            {specialty.options.map((s) => (
              <ToggleGroupItem key={s} value={s} className="h-10 flex-none px-3">
                {tParts(`specialty.${s}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("mode")}</Label>
          <ToggleGroup type="single" variant="outline" value={p.mode} onValueChange={(v) => v && set("mode", v as CoachProfile["mode"])} className="w-full">
            {coachingMode.options.map((m) => (
              <ToggleGroupItem key={m} value={m} className="h-11 flex-1">
                {tParts(`coachCard.${m}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <F id="city" label={t("city")}>
            <Input id="city" value={p.city} onChange={(e) => set("city", e.target.value)} />
          </F>
          <F id="gym" label={t("gym")}>
            <Input id="gym" value={p.gym ?? ""} onChange={(e) => set("gym", e.target.value || null)} />
          </F>
          <F id="years" label={t("years")}>
            <Input id="years" dir="ltr" inputMode="numeric" value={p.years} onChange={(e) => set("years", Math.max(0, Math.min(60, Number(e.target.value) || 0)))} />
          </F>
          <div className="flex flex-col gap-2">
            <Label>{t("languages")}</Label>
            <ToggleGroup
              type="multiple"
              variant="outline"
              value={p.languages}
              onValueChange={(v) => v.length && set("languages", v as CoachProfile["languages"])}
              className="w-full"
            >
              <ToggleGroupItem value="ar" className="h-11 flex-1">
                {tCp("lang_ar")}
              </ToggleGroupItem>
              <ToggleGroupItem value="en" className="h-11 flex-1">
                {tCp("lang_en")}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <F id="pmin" label={t("priceMin")}>
            <Input id="pmin" dir="ltr" inputMode="numeric" value={egp(p.price_min_piasters)} onChange={(e) => set("price_min_piasters", toPiasters(e.target.value))} />
          </F>
          <F id="pmax" label={t("priceMax")}>
            <Input id="pmax" dir="ltr" inputMode="numeric" value={egp(p.price_max_piasters)} onChange={(e) => set("price_max_piasters", toPiasters(e.target.value))} />
          </F>
          <F id="ig" label={t("instagram")}>
            <Input id="ig" dir="ltr" value={p.instagram ?? ""} onChange={(e) => set("instagram", e.target.value.replace(/^@/, "") || null)} />
          </F>
          <F id="wa" label={t("whatsapp")}>
            <Input id="wa" type="tel" dir="ltr" value={p.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value || null)} />
          </F>
        </div>
        <F id="certs" label={t("certificates")}>
          <Input id="certs" value={certs} onChange={(e) => setCerts(e.target.value)} />
        </F>
        <PackagesEditor drafts={drafts} onChange={setDrafts} />
        <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={save.isPending}>
          {save.isPending && <Loader2Icon className="animate-spin" />}
          {t("save")}
        </Button>
      </form>

      {/* Live preview: stacked under the form on phone, beside it on laptop. */}
      <aside>
        <div className="flex flex-col gap-2 lg:sticky lg:top-4">
          <SectionTitle className="mb-0">{t("preview")}</SectionTitle>
          <p className="text-sm text-muted-foreground">{t("previewBody")}</p>
          <CoachCard coach={p} />
          {p.bio && <p dir="auto" className="rounded-lg border bg-card p-4 text-sm leading-relaxed">{p.bio}</p>}
          {fromDrafts(drafts).map((pkg, i) => (
            <PackageCard key={i} pkg={pkg} className={pkg.highlighted ? "mt-3" : undefined} />
          ))}
        </div>
      </aside>
    </div>
  );
}

function F({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
