"use client";

import { api, ApiError } from "@coachi/core";
import { coachingMode, MAX_PACKAGES, slug as slugSchema, specialty, type CoachPackage, type CoachProfile } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheckIcon, EyeIcon, Loader2Icon, PencilIcon, PlusIcon, TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CoachCard } from "@/components/coachi/coach-card";
import { FieldError } from "@/components/coachi/field-error";
import { ImageField } from "@/components/coachi/image-field";
import { PackageCard } from "@/components/coachi/package-card";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenHeader, SectionTitle } from "@/components/coachi/screen-header";
import { StatusChip } from "@/components/coachi/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useMe } from "@/hooks/use-session";
import { initials } from "@/lib/initials";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { LandingSettings } from "./landing-settings";
import { PackagesEditor, fromDrafts, toDraft, type PackageDraft } from "./packages-editor";

const BIO_MAX = 600;

/** One part of a complete profile, and the field to jump to when it's missing. */
type Check = { key: "photo" | "bio" | "specialties" | "city" | "price" | "whatsapp" | "packages" | "cover"; done: boolean; target: string };

export function ProfileScreen() {
  const t = useTranslations("profile");
  const { coachId, orgId } = useMe();
  const profile = useQuery({ queryKey: qk.coachProfile(coachId), queryFn: () => api.directory.myProfile(coachId), enabled: !!coachId });
  const packages = useQuery({ queryKey: qk.coachPackages(coachId), queryFn: () => api.directory.myPackages(coachId), enabled: !!coachId });
  const brand = useQuery({ queryKey: qk.brand(orgId), queryFn: () => api.directory.brand(orgId), enabled: !!orgId });
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title={t("title")} subtitle={t("subtitle")} className="mb-2" />
      <QueryState query={profile}>
        {(p) => (
          <QueryState query={packages}>
            {(list) => (
              <QueryState query={brand}>{(b) => <ProfileForm initial={p} initialPackages={list} brand={b} orgId={orgId} />}</QueryState>
            )}
          </QueryState>
        )}
      </QueryState>
    </div>
  );
}

/** Everything the Save button sends, kept together so "unsaved changes" is one comparison. */
type FormState = { p: CoachProfile; certs: string; drafts: PackageDraft[]; logo: string | null };

function ProfileForm({
  initial,
  initialPackages,
  brand,
  orgId,
}: {
  initial: CoachProfile;
  initialPackages: CoachPackage[];
  brand: { logo_url: string | null; branded_app: boolean };
  orgId: string;
}) {
  const t = useTranslations("profile");
  const tParts = useTranslations("parts");
  const tCp = useTranslations("coachPage");
  const tLanding = useTranslations("landing");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const [baseline, setBaseline] = useState<FormState>(() => ({
    p: initial,
    certs: initial.certificates.join(", "),
    drafts: initialPackages.map(toDraft),
    logo: brand.logo_url,
  }));
  const [form, setForm] = useState(baseline);
  const { p, certs, drafts, logo } = form;
  const [savedSlug, setSavedSlug] = useState(initial.slug);
  const [slugError, setSlugError] = useState<"invalid" | "taken" | null>(null);
  const [priceError, setPriceError] = useState(false);
  // Phone only: the form and the preview don't fit side by side, so the coach flips between them.
  const [view, setView] = useState<"edit" | "preview">("edit");
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);

  const set = <K extends keyof CoachProfile>(key: K, value: CoachProfile[K]) => setForm((f) => ({ ...f, p: { ...f.p, [key]: value } }));
  const egp = (piasters: number | null) => (piasters == null ? "" : String(piasters / 100));
  const toPiasters = (v: string) => (v.trim() === "" ? null : Math.round(Number(v.replace(/[^\d.]/g, "")) * 100) || null);

  // Closing the tab or reloading with unsaved edits asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = useMutation({
    mutationFn: async () => {
      const saved = await api.directory.updateProfile(p.id, {
        ...p,
        certificates: certs.split(/[,،]/).map((c) => c.trim()).filter(Boolean),
      });
      const packages = await api.directory.savePackages(p.id, fromDrafts(drafts));
      if (logo !== baseline.logo) await api.directory.setLogo(orgId, logo);
      return { saved, packages };
    },
    onSuccess: ({ saved, packages }) => {
      toast.success(t("saved"));
      setSavedSlug(saved.slug);
      const next = { p: saved, certs: saved.certificates.join(", "), drafts: packages.map(toDraft), logo };
      setBaseline(next);
      setForm(next);
      queryClient.setQueryData(qk.coachPackages(p.id), packages);
      void queryClient.invalidateQueries({ queryKey: qk.coachProfile(p.id) });
      void queryClient.invalidateQueries({ queryKey: qk.landing(saved.slug) });
      void queryClient.invalidateQueries({ queryKey: qk.brand(orgId) });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.message === "slug_taken") {
        setSlugError("taken");
        jumpTo("slug");
      } else toast.error(t("saveFailed"));
    },
  });

  /** Show the form, scroll the field into view, and put the cursor in it. */
  const jumpTo = (id: string) => {
    setView("edit");
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const target = el.matches("input, textarea, button") ? el : el.querySelector<HTMLElement>("input, textarea, button");
      target?.focus({ preventScroll: true });
    });
  };

  const submit = () => {
    if (!slugSchema.safeParse(p.slug).success) {
      setSlugError("invalid");
      jumpTo("slug");
      return;
    }
    if (p.price_min_piasters != null && p.price_max_piasters != null && p.price_max_piasters < p.price_min_piasters) {
      setPriceError(true);
      jumpTo("pmax");
      return;
    }
    setSlugError(null);
    setPriceError(false);
    save.mutate();
  };

  const preview = fromDrafts(drafts);
  const checklist: Check[] = [
    { key: "photo", done: !!p.photo_url, target: "f-photo" },
    { key: "bio", done: p.bio.trim().length >= 40, target: "bio" },
    { key: "specialties", done: p.specialties.length > 0, target: "f-specialties" },
    { key: "city", done: !!p.city.trim(), target: "city" },
    { key: "price", done: p.price_min_piasters != null, target: "pmin" },
    { key: "whatsapp", done: !!p.whatsapp, target: "wa" },
    { key: "packages", done: preview.length > 0, target: "f-packages" },
    ...(p.page_published ? [{ key: "cover", done: !!p.cover_url, target: "f-cover" } satisfies Check] : []),
  ];

  return (
    <div className={cn("flex flex-col gap-4", dirty && "pb-20 lg:pb-16")}>
      <ToggleGroup
        type="single"
        variant="outline"
        value={view}
        onValueChange={(v) => v && setView(v as typeof view)}
        className="w-full lg:hidden"
      >
        <ToggleGroupItem value="edit" className="h-11 flex-1">
          <PencilIcon aria-hidden />
          {t("edit")}
        </ToggleGroupItem>
        <ToggleGroupItem value="preview" className="h-11 flex-1">
          <EyeIcon aria-hidden />
          {t("preview")}
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <form
          id="profile-form"
          className={cn("flex-col gap-5", view === "edit" ? "flex" : "hidden lg:flex")}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Completeness items={checklist} onJump={jumpTo} />

          <LandingSettings
            value={p}
            savedSlug={savedSlug}
            slugError={slugError}
            onChange={(patch) => {
              if ("slug" in patch) setSlugError(null);
              setForm((f) => ({ ...f, p: { ...f.p, ...patch } }));
            }}
          />

          <Section
            title={t("sectionDirectory")}
            body={t("sectionDirectoryBody")}
            action={p.listed ? <StatusChip tone="success">{t("listed")}</StatusChip> : null}
          >
            {!p.listed && <p className="rounded-md bg-info/12 p-3 text-sm text-info">{t("waiting")}</p>}
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="open" className="font-semibold">
                  {t("open")}
                </Label>
                <p className="text-sm text-muted-foreground">{t("openBody")}</p>
              </div>
              <Switch id="open" checked={p.open_for_clients} onCheckedChange={(v) => set("open_for_clients", v)} />
            </div>
          </Section>

          <Section title={t("sectionAbout")} body={t("sectionAboutBody")}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div id="f-photo">
                <ImageField
                  label={t("photo")}
                  shape="square"
                  value={p.photo_url}
                  onChange={(url) => set("photo_url", url)}
                  fallback={<span className="text-3xl font-bold">{initials(p.name)}</span>}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <ImageField label={t("logo")} shape="square" value={logo} onChange={(url) => setForm((f) => ({ ...f, logo: url }))} />
                <p className="text-xs text-muted-foreground">{brand.branded_app ? t("logoBody") : t("logoNotOnPlan")}</p>
              </div>
            </div>
            <F id="name" label={t("name")}>
              <Input id="name" dir="auto" autoComplete="name" value={p.name} onChange={(e) => set("name", e.target.value)} />
            </F>
            <F id="bio" label={t("bio")}>
              <Textarea
                id="bio"
                dir="auto"
                maxLength={BIO_MAX}
                value={p.bio}
                onChange={(e) => set("bio", e.target.value)}
                className="min-h-32"
                aria-describedby="bio-hint"
              />
              <div id="bio-hint" className="flex justify-between gap-3 text-xs text-muted-foreground">
                <span>{t("bioHint")}</span>
                <span className={cn("shrink-0 tabular-nums", p.bio.length > BIO_MAX * 0.9 && "font-semibold text-warning")}>
                  {t("bioCount", { count: p.bio.length, max: BIO_MAX })}
                </span>
              </div>
            </F>
          </Section>

          <Section title={t("sectionCoaching")} body={t("sectionCoachingBody")}>
            <div id="f-specialties" className="flex flex-col gap-2">
              <Label>{t("specialties")}</Label>
              <ToggleGroup
                type="multiple"
                variant="outline"
                value={p.specialties}
                onValueChange={(v) => set("specialties", v as CoachProfile["specialties"])}
                className="flex w-full flex-wrap justify-start"
              >
                {specialty.options.map((s) => (
                  <ToggleGroupItem
                    key={s}
                    value={s}
                    className="h-10 flex-none rounded-full px-4 data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                  >
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
                <Input id="city" autoComplete="address-level2" value={p.city} onChange={(e) => set("city", e.target.value)} />
              </F>
              <F id="gym" label={t("gym")}>
                <Input id="gym" value={p.gym ?? ""} onChange={(e) => set("gym", e.target.value || null)} />
              </F>
              <F id="years" label={t("years")}>
                <Input
                  id="years"
                  dir="ltr"
                  inputMode="numeric"
                  value={p.years}
                  onChange={(e) => set("years", Math.max(0, Math.min(60, Number(e.target.value.replace(/\D/g, "")) || 0)))}
                />
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
            </div>
            <F id="certs" label={t("certificates")}>
              <Input id="certs" value={certs} onChange={(e) => setForm((f) => ({ ...f, certs: e.target.value }))} aria-describedby="certs-hint" />
              <p id="certs-hint" className="text-xs text-muted-foreground">
                {t("certificatesHint")}
              </p>
            </F>
          </Section>

          <Section title={t("sectionPrices")} body={t("sectionPricesBody")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <F id="pmin" label={t("priceMin")}>
                <Input
                  id="pmin"
                  dir="ltr"
                  inputMode="numeric"
                  value={egp(p.price_min_piasters)}
                  onChange={(e) => {
                    setPriceError(false);
                    set("price_min_piasters", toPiasters(e.target.value));
                  }}
                />
              </F>
              <F id="pmax" label={t("priceMax")}>
                <Input
                  id="pmax"
                  dir="ltr"
                  inputMode="numeric"
                  value={egp(p.price_max_piasters)}
                  aria-invalid={priceError}
                  aria-describedby={priceError ? "pmax-error" : undefined}
                  onChange={(e) => {
                    setPriceError(false);
                    set("price_max_piasters", toPiasters(e.target.value));
                  }}
                />
              </F>
            </div>
            {priceError && <FieldError id="pmax-error">{t("priceOrder")}</FieldError>}
            <div className="grid gap-4 sm:grid-cols-2">
              <F id="wa" label={t("whatsapp")}>
                <Input
                  id="wa"
                  type="tel"
                  dir="ltr"
                  autoComplete="tel"
                  value={p.whatsapp ?? ""}
                  onChange={(e) => set("whatsapp", e.target.value || null)}
                  aria-describedby="wa-hint"
                />
                <p id="wa-hint" className="text-xs text-muted-foreground">
                  {t("whatsappHint")} <bdi dir="ltr">+20 100 123 4567</bdi>
                </p>
              </F>
              <F id="ig" label={t("instagram")}>
                <div className="relative" dir="ltr">
                  <span aria-hidden className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted-foreground">
                    @
                  </span>
                  <Input id="ig" className="ps-8" value={p.instagram ?? ""} onChange={(e) => set("instagram", e.target.value.replace(/^@/, "").trim() || null)} />
                </div>
              </F>
            </div>
          </Section>

          <Section id="f-packages" title={t("sectionPackages")} body={tLanding("packagesBody", { max: MAX_PACKAGES })}>
            <PackagesEditor drafts={drafts} onChange={(next) => setForm((f) => ({ ...f, drafts: next }))} />
          </Section>
        </form>

        {/* Live preview: its own tab on phone, sticky beside the form on laptop. */}
        <aside className={cn(view === "preview" ? "block" : "hidden lg:block", "lg:sticky lg:top-4")}>
          <div className="flex flex-col gap-3 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:pb-4">
            <div>
              <SectionTitle className="mb-1">{t("preview")}</SectionTitle>
              <p className="text-sm text-muted-foreground">{t("previewBody")}</p>
            </div>
            <CoachCard coach={p} />
            {p.bio && (
              <p dir="auto" className="rounded-lg border bg-card p-4 text-sm leading-relaxed whitespace-pre-line">
                {p.bio}
              </p>
            )}
            {preview.length > 0 ? (
              preview.map((pkg, i) => <PackageCard key={i} pkg={pkg} className={pkg.highlighted ? "mt-3" : undefined} />)
            ) : (
              <button
                type="button"
                onClick={() => jumpTo("f-packages")}
                className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm font-semibold text-muted-foreground hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <PlusIcon className="size-4" aria-hidden />
                {tLanding("addPackage")}
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* Unsaved changes: a sticky Save bar, above the tab bar on phone. */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 border-t bg-background/95 backdrop-blur lg:bottom-0 lg:z-40 lg:ps-[var(--sidebar-width)] lg:pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex max-w-[1200px] items-center gap-2 px-4 py-3 lg:px-6">
            <TriangleAlertIcon className="size-5 shrink-0 text-warning" aria-hidden />
            <span className="flex-1 text-sm font-semibold" role="status">
              {t("unsaved")}
            </span>
            <Button
              type="button"
              variant="ghost"
              disabled={save.isPending}
              onClick={() => {
                setForm(baseline);
                setSlugError(null);
                setPriceError(false);
              }}
            >
              {t("discard")}
            </Button>
            <Button type="submit" form="profile-form" disabled={save.isPending}>
              {save.isPending ? <Loader2Icon className="animate-spin" /> : <CircleCheckIcon />}
              {tCommon("save")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** How much of the profile is filled, with a chip per missing part that jumps to it. */
function Completeness({ items, onJump }: { items: Check[]; onJump: (id: string) => void }) {
  const t = useTranslations("profile");
  const done = items.filter((i) => i.done).length;
  const missing = items.filter((i) => !i.done);
  if (!missing.length) {
    return (
      <p className="flex items-center gap-2 rounded-lg border bg-card p-4 text-sm font-semibold">
        <CircleCheckIcon className="size-5 text-success" aria-hidden />
        {t("completeAll")}
      </p>
    );
  }
  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:p-5" aria-labelledby="complete-title">
      <div className="flex flex-col gap-2">
        <h2 id="complete-title" className="font-semibold">
          {t("completeTitle", { done, total: items.length })}
        </h2>
        <Progress value={(done / items.length) * 100} aria-labelledby="complete-title" />
      </div>
      <p className="text-sm text-muted-foreground">{t("completeBody")}</p>
      <div className="flex flex-wrap gap-2">
        {missing.map((i) => (
          <Button key={i.key} type="button" variant="outline" size="sm" className="rounded-full" onClick={() => onJump(i.target)}>
            <PlusIcon data-icon="inline-start" />
            {t(`complete_${i.key}`)}
          </Button>
        ))}
      </div>
    </section>
  );
}

/** A titled card that groups related fields. */
function Section({
  id,
  title,
  body,
  action,
  children,
}: {
  id?: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-4 flex-col gap-5 rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-semibold">{title}</h2>
          {body && <p className="text-sm text-muted-foreground">{body}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
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
