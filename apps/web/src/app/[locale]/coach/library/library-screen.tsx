"use client";

import { api } from "@coachi/core";
import { equipment, muscleGroup, type Exercise, type Food } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlayCircleIcon, PlusIcon, SearchIcon, SearchXIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { QueryState } from "@/components/coachi/query-state";
import { ResponsiveDialog } from "@/components/coachi/responsive-dialog";
import { ScreenHeader } from "@/components/coachi/screen-header";
import { SortableTable, type Column } from "@/components/coachi/sortable-table";
import { EmptyState } from "@/components/coachi/states";
import { StatusChip } from "@/components/coachi/status-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";

type LibT = ReturnType<typeof useTranslations<"library">>;
const key = (t: LibT, k: string) => t(k as Parameters<LibT>[0]);

const matches = (q: string, item: { name_ar: string; name_en: string }) =>
  !q || `${item.name_ar} ${item.name_en}`.toLowerCase().includes(q.trim().toLowerCase());

export function LibraryScreen({ admin = false }: { admin?: boolean }) {
  const t = useTranslations("library");
  const tAdmin = useTranslations("admin.libraries");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"exercises" | "foods">("exercises");
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader
        title={admin ? tAdmin("title") : t("title")}
        className="mb-2"
        action={
          <Button onClick={() => setAdding(true)}>
            <PlusIcon data-icon="inline-start" />
            {tab === "exercises" ? t("addExercise") : t("addFood")}
          </Button>
        }
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="exercises">{t("exercises")}</TabsTrigger>
            <TabsTrigger value="foods">{t("foods")}</TabsTrigger>
          </TabsList>
          <div className="relative sm:w-72">
            <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-hint" aria-hidden />
            <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="ps-10" />
          </div>
        </div>
        <TabsContent value="exercises">
          <Exercises search={search} onAdd={() => setAdding(true)} />
        </TabsContent>
        <TabsContent value="foods">
          <Foods search={search} onAdd={() => setAdding(true)} />
        </TabsContent>
      </Tabs>
      {tab === "exercises" ? <AddExerciseDialog open={adding} onOpenChange={setAdding} /> : <AddFoodDialog open={adding} onOpenChange={setAdding} />}
    </div>
  );
}

/** A shared item must have both names; a missing one gets a warning chip. */
function MissingName() {
  const t = useTranslations("admin.libraries");
  return <StatusChip tone="warning">{t("missingName")}</StatusChip>;
}

function SourceBadge({ own }: { own: boolean }) {
  const t = useTranslations("library");
  return own ? <Badge className="bg-primary/12 text-primary">{t("own")}</Badge> : <Badge variant="secondary">{t("shared")}</Badge>;
}

function NotFound({ onAdd, label }: { onAdd: () => void; label: string }) {
  const t = useTranslations("library");
  return (
    <EmptyState
      icon={SearchXIcon}
      title={t("notFound")}
      action={
        <Button variant="secondary" onClick={onAdd}>
          <PlusIcon data-icon="inline-start" />
          {label}
        </Button>
      }
    />
  );
}

function Exercises({ search, onAdd }: { search: string; onAdd: () => void }) {
  const t = useTranslations("library");
  const list = useQuery({ queryKey: qk.exercises, queryFn: () => api.training.exercises() });
  const columns: Column<Exercise>[] = [
    { key: "ar", header: t("nameAr"), sortValue: (e) => e.name_ar, cell: (e) => (e.name_ar ? <span lang="ar" className="font-semibold">{e.name_ar}</span> : <MissingName />) },
    { key: "en", header: t("nameEn"), sortValue: (e) => e.name_en, cell: (e) => (e.name_en ? <span lang="en">{e.name_en}</span> : <MissingName />) },
    { key: "muscle", header: t("muscle"), sortValue: (e) => e.muscle, cell: (e) => key(t, `muscle_${e.muscle}`) },
    { key: "eq", header: t("equipment"), sortValue: (e) => e.equipment, cell: (e) => key(t, `eq_${e.equipment}`) },
    {
      key: "src",
      header: "",
      cell: (e) => (
        <span className="flex items-center gap-2">
          <SourceBadge own={e.org_id !== null} />
          {e.video_url && <PlayCircleIcon className="size-4 text-hint" aria-label={t("video")} />}
        </span>
      ),
    },
  ];
  return (
    <QueryState query={list}>
      {(rows) => {
        const shown = rows.filter((e) => matches(search, e));
        if (shown.length === 0) return <NotFound onAdd={onAdd} label={t("addExercise")} />;
        return (
          <>
            <p className="mb-2 text-sm text-muted-foreground">{t("count", { count: shown.length })}</p>
            <ul className="flex flex-col divide-y rounded-lg border bg-card lg:hidden">
              {shown.map((e) => (
                <li key={e.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold" lang="ar">
                      {e.name_ar}
                    </p>
                    <p className="truncate text-sm text-muted-foreground" lang="en">
                      {e.name_en}
                    </p>
                  </div>
                  <span className="text-xs text-hint">{key(t, `muscle_${e.muscle}`)}</span>
                  <SourceBadge own={e.org_id !== null} />
                </li>
              ))}
            </ul>
            <div className="hidden lg:block">
              <SortableTable label={t("exercises")} columns={columns} rows={shown} rowKey={(e) => e.id} defaultSort={{ key: "muscle", dir: "asc" }} />
            </div>
          </>
        );
      }}
    </QueryState>
  );
}

function Foods({ search, onAdd }: { search: string; onAdd: () => void }) {
  const t = useTranslations("library");
  const fmt = useFmt();
  const list = useQuery({ queryKey: qk.foods, queryFn: () => api.nutrition.foods() });
  const num = (n: number) => <span className="tabular-nums">{fmt.num(n)}</span>;
  const columns: Column<Food>[] = [
    { key: "ar", header: t("nameAr"), sortValue: (f) => f.name_ar, cell: (f) => <span lang="ar" className="font-semibold">{f.name_ar}</span> },
    { key: "en", header: t("nameEn"), sortValue: (f) => f.name_en, cell: (f) => <span lang="en">{f.name_en}</span> },
    { key: "serving", header: t("serving"), cell: (f) => <span dir="ltr">{f.serving}</span> },
    { key: "kcal", header: t("kcal"), sortValue: (f) => f.kcal, cell: (f) => num(f.kcal) },
    { key: "p", header: t("protein"), sortValue: (f) => f.protein, cell: (f) => num(f.protein) },
    { key: "c", header: t("carbs"), sortValue: (f) => f.carbs, cell: (f) => num(f.carbs) },
    { key: "f", header: t("fat"), sortValue: (f) => f.fat, cell: (f) => num(f.fat) },
    { key: "src", header: "", cell: (f) => <SourceBadge own={f.org_id !== null} /> },
  ];
  return (
    <QueryState query={list}>
      {(rows) => {
        const shown = rows.filter((f) => matches(search, f));
        if (shown.length === 0) return <NotFound onAdd={onAdd} label={t("addFood")} />;
        return (
          <>
            <p className="mb-2 text-sm text-muted-foreground">{t("count", { count: shown.length })}</p>
            <ul className="flex flex-col divide-y rounded-lg border bg-card lg:hidden">
              {shown.map((f) => (
                <li key={f.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold" lang="ar">
                      {f.name_ar}
                    </p>
                    <p className="truncate text-sm text-muted-foreground" lang="en">
                      {f.name_en} · <span dir="ltr">{f.serving}</span>
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{fmt.kcal(f.kcal)}</span>
                </li>
              ))}
            </ul>
            <div className="hidden lg:block">
              <SortableTable label={t("foods")} columns={columns} rows={shown} rowKey={(f) => f.id} defaultSort={{ key: "en", dir: "asc" }} />
            </div>
          </>
        );
      }}
    </QueryState>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function AddExerciseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("library");
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name_ar: "", name_en: "", muscle: "chest", equipment: "dumbbell", video_url: "" });
  const add = useMutation({
    mutationFn: () =>
      api.training.addExercise({
        name_ar: form.name_ar.trim(),
        name_en: form.name_en.trim(),
        muscle: form.muscle as Exercise["muscle"],
        equipment: form.equipment as Exercise["equipment"],
        video_url: form.video_url.trim() || null,
      }),
    onSuccess: () => {
      toast.success(t("added"));
      void queryClient.invalidateQueries({ queryKey: qk.exercises });
      onOpenChange(false);
      setForm((f) => ({ ...f, name_ar: "", name_en: "", video_url: "" }));
    },
  });
  const valid = form.name_ar.trim() && form.name_en.trim();
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("addExercise")}
      footer={
        <Button className="w-full sm:w-auto" disabled={!valid || add.isPending} onClick={() => add.mutate()}>
          {add.isPending && <Loader2Icon className="animate-spin" />}
          {t("addExercise")}
        </Button>
      }
    >
      <div className="grid gap-4 pb-2 sm:grid-cols-2">
        <Field id="ex-ar" label={t("nameAr")}>
          <Input id="ex-ar" lang="ar" dir="rtl" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
        </Field>
        <Field id="ex-en" label={t("nameEn")}>
          <Input id="ex-en" lang="en" dir="ltr" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
        </Field>
        <Field id="ex-muscle" label={t("muscle")}>
          <Select value={form.muscle} onValueChange={(v) => setForm({ ...form, muscle: v })}>
            <SelectTrigger id="ex-muscle" className="h-12 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {muscleGroup.options.map((m) => (
                <SelectItem key={m} value={m}>
                  {key(t, `muscle_${m}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="ex-eq" label={t("equipment")}>
          <Select value={form.equipment} onValueChange={(v) => setForm({ ...form, equipment: v })}>
            <SelectTrigger id="ex-eq" className="h-12 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {equipment.options.map((e) => (
                <SelectItem key={e} value={e}>
                  {key(t, `eq_${e}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field id="ex-video" label={t("video")}>
            <Input id="ex-video" type="url" dir="ltr" placeholder="https://youtube.com/…" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
          </Field>
        </div>
      </div>
    </ResponsiveDialog>
  );
}

function AddFoodDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("library");
  const queryClient = useQueryClient();
  const empty = { name_ar: "", name_en: "", serving: "100 g", serving_g: "100", kcal: "", protein: "", carbs: "", fat: "" };
  const [form, setForm] = useState(empty);
  const n = (v: string) => Number(v.replace(",", ".")) || 0;
  const add = useMutation({
    mutationFn: () =>
      api.nutrition.addFood({
        name_ar: form.name_ar.trim(),
        name_en: form.name_en.trim(),
        serving: form.serving.trim() || "1",
        serving_g: n(form.serving_g) || null,
        kcal: n(form.kcal),
        protein: n(form.protein),
        carbs: n(form.carbs),
        fat: n(form.fat),
      }),
    onSuccess: () => {
      toast.success(t("added"));
      void queryClient.invalidateQueries({ queryKey: qk.foods });
      onOpenChange(false);
      setForm(empty);
    },
  });
  const valid = form.name_ar.trim() && form.name_en.trim() && form.kcal;
  const numField = (k: keyof typeof form, label: string) => (
    <Field id={`fd-${k}`} label={label}>
      <Input id={`fd-${k}`} dir="ltr" inputMode="decimal" className="tabular-nums" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
    </Field>
  );
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("addFood")}
      footer={
        <Button className="w-full sm:w-auto" disabled={!valid || add.isPending} onClick={() => add.mutate()}>
          {add.isPending && <Loader2Icon className="animate-spin" />}
          {t("addFood")}
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-4 pb-2">
        <Field id="fd-ar" label={t("nameAr")}>
          <Input id="fd-ar" lang="ar" dir="rtl" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
        </Field>
        <Field id="fd-en" label={t("nameEn")}>
          <Input id="fd-en" lang="en" dir="ltr" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
        </Field>
        <Field id="fd-serving" label={t("serving")}>
          <Input id="fd-serving" dir="ltr" value={form.serving} onChange={(e) => setForm({ ...form, serving: e.target.value })} />
        </Field>
        {numField("serving_g", t("servingG"))}
        {numField("kcal", t("kcal"))}
        {numField("protein", t("protein"))}
        {numField("carbs", t("carbs"))}
        {numField("fat", t("fat"))}
      </div>
    </ResponsiveDialog>
  );
}
