"use client";

import { api } from "@coachi/core";
import type { Food, MacroTargets, NutritionPlan, NutritionPlanFull } from "@coachi/validation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookmarkPlusIcon, PlusIcon, SparklesIcon, SplitIcon, Trash2Icon, UsersRoundIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { use, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AssignToClientsDialog } from "@/components/coach/assign-dialogs";
import { SaveIndicator } from "@/components/coach/save-indicator";
import { QueryState } from "@/components/coachi/query-state";
import { BackLink } from "@/components/coachi/screen-header";
import { ListSkeleton } from "@/components/coachi/states";
import { MacroBar } from "@/components/coachi/stats";
import { ResponsiveDialog } from "@/components/coachi/responsive-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/hooks/use-session";
import { useRouter } from "@/i18n/navigation";
import { useFmt, useLocalName } from "@/lib/format";
import { useApiErrorToast } from "@/lib/api-error";
import { qk } from "@/lib/query-keys";
import { suggestTargets } from "@/lib/targets";
import { useAutosave } from "@/lib/use-autosave";
import * as ops from "./nutrition-ops";

export function NutritionBuilder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return id === "new" ? <CreatePlan /> : <LoadPlan id={id} />;
}

function CreatePlan() {
  const t = useTranslations("plans");
  const tNb = useTranslations("nutritionBuilder");
  const router = useRouter();
  const { orgId, coachId } = useMe();
  const showError = useApiErrorToast();
  const created = useRef(false);
  useEffect(() => {
    if (!orgId || !coachId || created.current) return;
    created.current = true;
    const draft = ops.newPlan(orgId, coachId, t("untitledNutrition"), (n) => tNb("newMeal", { n }));
    void api.nutrition.savePlan(draft)
      .then((saved) => router.replace(`/coach/plans/nutrition/${saved.plan.id}`))
      .catch((error: unknown) => {
        // Read-only (ended subscription) or not allowed: say why and go back to the plans list.
        showError(error);
        router.replace("/coach/plans");
      });
  }, [orgId, coachId, router, t, tNb, showError]);
  return <ListSkeleton />;
}

function LoadPlan({ id }: { id: string }) {
  const plan = useQuery({ queryKey: qk.nutritionPlan(id), queryFn: () => api.nutrition.getPlan(id), staleTime: Infinity });
  // key: switching between training / rest versions mounts a fresh builder.
  return <QueryState query={plan}>{(data) => <Builder key={data.plan.id} initial={data} />}</QueryState>;
}

function Builder({ initial }: { initial: NutritionPlanFull }) {
  const t = useTranslations("nutritionBuilder");
  const tB = useTranslations("builder");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { coachId } = useMe();
  const [draft, setDraft] = useState(initial);
  const [version, setVersion] = useState(0);
  const [picker, setPicker] = useState<{ mealId: string; swapWith?: string } | null>(null);
  const [assigning, setAssigning] = useState(false);

  const status = useAutosave(draft, version, async (p) => {
    await api.nutrition.savePlan(p);
    void queryClient.invalidateQueries({ queryKey: qk.nutritionPlans(coachId) });
  });

  const edit = (fn: (p: NutritionPlanFull) => NutritionPlanFull) => {
    setDraft(fn);
    setVersion((v) => v + 1);
  };
  const editWithUndo = (fn: (p: NutritionPlanFull) => NutritionPlanFull, message: string) => {
    const before = draft;
    edit(fn);
    toast(message, { duration: 6000, action: { label: tCommon("undo"), onClick: () => edit(() => before) } });
  };
  const setTargets = (patch: Partial<MacroTargets>) => edit((p) => ({ ...p, plan: { ...p.plan, targets: { ...p.plan.targets, ...patch } } }));

  // Client plans: the client's details drive the suggestion, and sibling plans are the day versions.
  const clientId = draft.plan.client_id;
  const file = useQuery({ queryKey: qk.clientFile(clientId ?? ""), queryFn: () => api.clients.get(clientId!), enabled: !!clientId });
  const siblings = useQuery({ queryKey: qk.nutritionPlans(coachId), queryFn: () => api.nutrition.plans(coachId), enabled: !!clientId && !!coachId });
  const versions = (siblings.data ?? []).filter((p) => clientId && p.client_id === clientId && !p.deleted_at);
  const suggestion = clientId ? suggestTargets(file.data?.details ?? null, file.data?.client.goal ?? null) : null;

  const totals = ops.totals(draft);
  const isTemplate = clientId === null;

  const createVersion = (type: NutritionPlan["day_type"]) =>
    void api.nutrition
      .savePlan(ops.copyPlan(draft, { day_type: type, name: `${draft.plan.name} · ${t(type)}` }))
      .then((saved) => {
        toast.success(t("versionCreated"));
        void queryClient.invalidateQueries({ queryKey: qk.nutritionPlans(coachId) });
        router.push(`/coach/plans/nutrition/${saved.plan.id}`);
      });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <BackLink href="/coach/plans" label={tCommon("back")} />
        <Input
          value={draft.plan.name}
          onChange={(e) => edit((p) => ({ ...p, plan: { ...p.plan, name: e.target.value } }))}
          aria-label={tB("name")}
          className="h-11 max-w-md flex-1 border-transparent bg-transparent text-xl font-bold hover:border-border focus-visible:bg-secondary"
        />
        <SaveIndicator status={status} />
        <div className="ms-auto flex gap-2">
          {isTemplate ? (
            <Button variant="secondary" onClick={() => setAssigning(true)}>
              <UsersRoundIcon data-icon="inline-start" />
              {tB("assignClient")}
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() =>
                void api.nutrition.savePlan(ops.copyPlan(draft, { client_id: null })).then(() => {
                  toast.success(tB("templateSaved"));
                  void queryClient.invalidateQueries({ queryKey: qk.nutritionPlans(coachId) });
                })
              }
            >
              <BookmarkPlusIcon data-icon="inline-start" />
              {tB("saveTemplate")}
            </Button>
          )}
        </div>
      </div>

      {/* Day versions: training / rest (client plans) or the plan's own day type (templates). */}
      <Tabs
        value={draft.plan.day_type}
        onValueChange={(v) => {
          const type = v as NutritionPlan["day_type"];
          if (isTemplate) return edit((p) => ({ ...p, plan: { ...p.plan, day_type: type } }));
          const other = versions.find((p) => p.day_type === type);
          if (other) router.push(`/coach/plans/nutrition/${other.id}`);
          else createVersion(type);
        }}
      >
        <TabsList>
          {(["training", "rest", "any"] as const).map((type) => {
            const exists = isTemplate || type === draft.plan.day_type || versions.some((p) => p.day_type === type);
            return (
              <TabsTrigger key={type} value={type} className="gap-1">
                {!exists && <PlusIcon className="size-3.5" aria-hidden />}
                {exists ? t(type) : t("addVersion", { type: t(type) })}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="order-2 flex min-w-0 flex-col gap-4 lg:order-1">
          {/* Totals stick to the top and update live. Over target turns warning; it never blocks saving. */}
          <div className="sticky top-0 z-10 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur lg:mx-0 lg:rounded-lg lg:border">
            <p className="mb-2 text-xs font-bold tracking-[0.12em] text-hint uppercase">{t("totals")}</p>
            <MacroBar full eaten={totals} targets={draft.plan.targets} />
          </div>

          <Accordion type="multiple" defaultValue={draft.meals.map((m) => m.meal.id)}>
            {draft.meals.map((m) => (
              <MealEditor
                key={m.meal.id}
                meal={m}
                onRename={(name) => edit((p) => ops.setMeal(p, m.meal.id, { name }))}
                onNote={(note) => edit((p) => ops.setMeal(p, m.meal.id, { note: note || null }))}
                onAmount={(itemId, amount) => edit((p) => ops.setAmount(p, m.meal.id, itemId, amount))}
                onRemoveFood={(itemId) => editWithUndo((p) => ops.removeFood(p, m.meal.id, itemId), t("removeFood"))}
                onAddFood={() => setPicker({ mealId: m.meal.id })}
                onAddChoice={(itemId) => setPicker({ mealId: m.meal.id, swapWith: itemId })}
                onRemove={() => editWithUndo((p) => ops.removeMeal(p, m.meal.id), t("removeMeal"))}
              />
            ))}
          </Accordion>
          <Button variant="secondary" className="w-fit" onClick={() => edit((p) => ops.addMeal(p, t("newMeal", { n: p.meals.length + 1 })))}>
            <PlusIcon data-icon="inline-start" />
            {t("addMeal")}
          </Button>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-notes">{t("planNotes")}</Label>
            <Textarea
              id="plan-notes"
              value={draft.plan.notes ?? ""}
              placeholder={t("planNotesPlaceholder")}
              onChange={(e) => edit((p) => ({ ...p, plan: { ...p.plan, notes: e.target.value || null } }))}
            />
          </div>
        </div>

        <aside className="order-1 lg:order-2">
          <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 lg:sticky lg:top-4">
            <p className="font-semibold">{t("targets")}</p>
            {clientId &&
              (suggestion ? (
                <div className="flex flex-col gap-2 rounded-md bg-info/12 p-3 text-sm text-info">
                  <p>{t("suggested", { kcal: suggestion.kcal })}</p>
                  <Button size="sm" variant="secondary" className="w-fit" onClick={() => setTargets(suggestion)}>
                    <SparklesIcon data-icon="inline-start" />
                    {t("useSuggested")}
                  </Button>
                </div>
              ) : (
                file.data && <p className="text-xs text-hint">{t("noSuggestion")}</p>
              ))}
            <div className="grid grid-cols-2 gap-3">
              {(["kcal", "protein", "carbs", "fat", "water_ml"] as const).map((key) => (
                <div key={key} className={key === "kcal" ? "col-span-2 flex flex-col gap-1" : "flex flex-col gap-1"}>
                  <Label htmlFor={`t-${key}`} className="text-xs">
                    {t(key === "water_ml" ? "water" : key)}
                  </Label>
                  <Input
                    id={`t-${key}`}
                    dir="ltr"
                    inputMode="numeric"
                    className="h-10 tabular-nums"
                    value={draft.plan.targets[key]}
                    onChange={(e) => setTargets({ [key]: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                  />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <FoodPicker
        open={!!picker}
        onOpenChange={(open) => !open && setPicker(null)}
        onPick={(food) => {
          if (picker) edit((p) => ops.addFood(p, picker.mealId, food, picker.swapWith));
          setPicker(null);
        }}
      />

      <AssignToClientsDialog kind="nutrition" plan={assigning ? { id: draft.plan.id, name: draft.plan.name } : null} onOpenChange={setAssigning} />
    </div>
  );
}

function MealEditor({
  meal,
  onRename,
  onNote,
  onAmount,
  onRemoveFood,
  onAddFood,
  onAddChoice,
  onRemove,
}: {
  meal: NutritionPlanFull["meals"][number];
  onRename: (name: string) => void;
  onNote: (note: string) => void;
  onAmount: (itemId: string, amount: number) => void;
  onRemoveFood: (itemId: string) => void;
  onAddFood: () => void;
  onAddChoice: (itemId: string) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("nutritionBuilder");
  const tMeals = useTranslations("meals");
  const fmt = useFmt();
  const name = useLocalName();
  const kcal = ops.mealTotals(meal).kcal;

  return (
    <AccordionItem value={meal.meal.id} className="mb-3 rounded-lg border bg-card px-4 last:border-b">
      <AccordionTrigger className="hover:no-underline">
        <span className="flex flex-1 items-center justify-between gap-3 pe-2">
          <span className="font-semibold">{meal.meal.name}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{fmt.kcal(kcal)}</span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input value={meal.meal.name} onChange={(e) => onRename(e.target.value)} aria-label={t("mealName")} className="h-10" />
          <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label={t("removeMeal")} onClick={onRemove}>
            <Trash2Icon />
          </Button>
        </div>
        {meal.items.length === 0 ? (
          <p className="text-sm text-hint">{t("emptyMeal")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {meal.items.map(({ item, food }, i) => {
              const startsGroup = item.swap_group && meal.items[i - 1]?.item.swap_group !== item.swap_group;
              const inGroup = !!item.swap_group;
              return (
                <li key={item.id} className="flex flex-col gap-1">
                  {inGroup && !startsGroup && <span className="ps-3 text-xs font-bold text-hint">{tMeals("swap")}</span>}
                  <div className={inGroup ? "flex items-center gap-2 rounded-md border-s-4 border-s-info bg-secondary/50 p-2" : "flex items-center gap-2 rounded-md bg-secondary/50 p-2"}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{name(food)}</p>
                      <p className="text-xs text-hint tabular-nums">
                        {fmt.kcal(food.kcal * item.amount)} · P {fmt.num(food.protein * item.amount, 0)} · C {fmt.num(food.carbs * item.amount, 0)} · F{" "}
                        {fmt.num(food.fat * item.amount, 0)}
                      </p>
                    </div>
                    <Input
                      dir="ltr"
                      inputMode="decimal"
                      aria-label={`${t("amount")} (${food.serving})`}
                      title={t("perServing", { serving: food.serving })}
                      value={item.amount}
                      onChange={(e) => {
                        const v = Number(e.target.value.replace(",", "."));
                        if (!Number.isNaN(v) && v > 0) onAmount(item.id, v);
                      }}
                      className="h-10 w-16 text-center tabular-nums"
                    />
                    <span className="hidden w-20 truncate text-xs text-hint sm:block" dir="ltr">
                      × {food.serving}
                    </span>
                    <Button variant="ghost" size="icon-sm" aria-label={t("orChoice")} title={t("orChoice")} onClick={() => onAddChoice(item.id)}>
                      <SplitIcon />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label={t("removeFood")} onClick={() => onRemoveFood(item.id)}>
                      <XIcon />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Button variant="secondary" size="sm" className="w-fit" onClick={onAddFood}>
          <PlusIcon data-icon="inline-start" />
          {t("addFood")}
        </Button>
        <Input value={meal.meal.note ?? ""} onChange={(e) => onNote(e.target.value)} placeholder={t("mealNote")} aria-label={t("mealNote")} className="h-10" />
      </AccordionContent>
    </AccordionItem>
  );
}

function FoodPicker({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (open: boolean) => void; onPick: (food: Food) => void }) {
  const t = useTranslations("nutritionBuilder");
  const fmt = useFmt();
  const name = useLocalName();
  const foods = useQuery({ queryKey: qk.foods, queryFn: () => api.nutrition.foods(), enabled: open });
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={t("addFood")}>
      <Command className="rounded-lg border" filter={(value, search) => (value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}>
        <CommandInput placeholder={t("searchFoods")} autoFocus />
        <CommandList className="max-h-80">
          <CommandEmpty>{t("noFood")}</CommandEmpty>
          {(foods.data ?? []).map((f) => (
            <CommandItem key={f.id} value={`${f.name_en} ${f.name_ar}`} onSelect={() => onPick(f)} className="min-h-11 gap-2">
              <span className="flex-1">{name(f)}</span>
              <span className="text-xs text-hint tabular-nums" dir="ltr">
                {f.serving} · {fmt.kcal(f.kcal)}
              </span>
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </ResponsiveDialog>
  );
}
