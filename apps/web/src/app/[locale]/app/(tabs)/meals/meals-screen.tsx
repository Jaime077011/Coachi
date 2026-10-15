"use client";

import { api, type MealLogInput } from "@coachi/core";
import type { MealFull, MacroTotals, NutritionPlanFull } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, MessageSquareTextIcon, UtensilsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { QueryState } from "@/components/coachi/query-state";
import { ResponsiveDialog } from "@/components/coachi/responsive-dialog";
import { ScreenHeader } from "@/components/coachi/screen-header";
import { EmptyState } from "@/components/coachi/states";
import { MacroBar } from "@/components/coachi/stats";
import { StatusChip } from "@/components/coachi/status-chip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/hooks/use-session";
import { useFmt, useLocalName } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { isoDate, useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";

type Choices = Record<string, string>; // `${mealId}:${swapGroup}` → meal_item id

/** Items that count: everything without a swap group, plus the chosen item of each group. */
function chosenItems(meal: MealFull, choices: Choices) {
  const seen = new Set<string>();
  return meal.items.filter(({ item }) => {
    if (!item.swap_group) return true;
    const key = `${meal.meal.id}:${item.swap_group}`;
    const chosen = choices[key];
    if (chosen) return chosen === item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function totals(plan: NutritionPlanFull, choices: Choices): MacroTotals {
  const sum = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const meal of plan.meals) {
    if (meal.log?.status !== "eaten") continue;
    for (const { item, food } of chosenItems(meal, choices)) {
      sum.kcal += food.kcal * item.amount;
      sum.protein += food.protein * item.amount;
      sum.carbs += food.carbs * item.amount;
      sum.fat += food.fat * item.amount;
    }
  }
  return { kcal: Math.round(sum.kcal), protein: Math.round(sum.protein), carbs: Math.round(sum.carbs), fat: Math.round(sum.fat) };
}

export function MealsScreen() {
  const t = useTranslations("meals");
  const tToday = useTranslations("today");
  const { clientId } = useMe();
  const now = useNow();
  const date = now ? isoDate(now) : "";
  const queryClient = useQueryClient();
  const key = qk.meals(clientId, date);
  const plan = useQuery({ queryKey: key, queryFn: () => api.nutrition.clientDay(clientId, date), enabled: !!clientId && !!date });
  const [choices, setChoices] = useState<Choices>({});
  const [otherFor, setOtherFor] = useState<string | null>(null);
  const [otherNote, setOtherNote] = useState("");

  const log = useMutation({
    mutationFn: (input: MealLogInput) => api.nutrition.logMeal(clientId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const before = queryClient.getQueryData<NutritionPlanFull | null>(key);
      queryClient.setQueryData<NutritionPlanFull | null>(key, (old) =>
        old
          ? {
              ...old,
              meals: old.meals.map((m) =>
                m.meal.id === input.meal_id
                  ? {
                      ...m,
                      log: {
                        id: m.log?.id ?? "pending",
                        client_id: clientId,
                        created_at: m.log?.created_at ?? new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        deleted_at: null,
                        ...input,
                      },
                    }
                  : m,
              ),
            }
          : old,
      );
      return { before };
    },
    onError: (_e, _i, ctx) => {
      queryClient.setQueryData(key, ctx?.before);
      toast.error(tToday("meals"));
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: qk.today(clientId) }),
  });

  const tick = (meal: MealFull) => {
    const eaten = meal.log?.status === "eaten";
    log.mutate({ meal_id: meal.meal.id, date, status: eaten ? "skipped" : "eaten", note: null });
    if (eaten) {
      toast(t("undoToast"), {
        action: { label: t("eaten"), onClick: () => log.mutate({ meal_id: meal.meal.id, date, status: "eaten", note: null }) },
        duration: 6000,
      });
    }
  };

  return (
    <div className="flex flex-col">
      <ScreenHeader title={t("title")} back="/app/today" />
      <QueryState
        query={plan}
        isEmpty={(d) => d === null}
        empty={<EmptyState icon={UtensilsIcon} title={t("noPlanTitle")} body={t("noPlanBody")} />}
      >
        {(data) => (
          <div className="flex flex-col gap-4">
            <div className="sticky top-0 z-10 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur">
              <div className="mb-2 flex items-center justify-between">
                <StatusChip tone="info" className="py-0.5">
                  {data!.plan.day_type === "rest" ? t("restDay") : t("trainingDay")}
                </StatusChip>
              </div>
              <MacroBar full eaten={totals(data!, choices)} targets={data!.plan.targets} />
            </div>

            <Accordion type="multiple" defaultValue={data!.meals.filter((m) => !m.log).map((m) => m.meal.id).slice(0, 1)}>
              {data!.meals.map((meal) => (
                <MealRow
                  key={meal.meal.id}
                  meal={meal}
                  choices={choices}
                  onChoose={(group, itemId) => setChoices((c) => ({ ...c, [`${meal.meal.id}:${group}`]: itemId }))}
                  onTick={() => tick(meal)}
                  onOther={() => {
                    setOtherNote(meal.log?.status === "ate_other" ? (meal.log.note ?? "") : "");
                    setOtherFor(meal.meal.id);
                  }}
                />
              ))}
            </Accordion>

            {data!.plan.notes && (
              <div className="rounded-lg border bg-card p-4">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">{t("planNotes")}</p>
                <p className="text-sm">{data!.plan.notes}</p>
              </div>
            )}
          </div>
        )}
      </QueryState>

      <ResponsiveDialog
        open={otherFor !== null}
        onOpenChange={(open) => !open && setOtherFor(null)}
        title={t("ateOtherTitle")}
        footer={
          <Button
            className="w-full sm:w-auto"
            disabled={!otherNote.trim()}
            onClick={() => {
              log.mutate({ meal_id: otherFor!, date, status: "ate_other", note: otherNote.trim() });
              setOtherFor(null);
              toast.success(t("savedToast"));
            }}
          >
            {t("save")}
          </Button>
        }
      >
        <Textarea
          value={otherNote}
          onChange={(e) => setOtherNote(e.target.value)}
          placeholder={t("ateOtherPlaceholder")}
          aria-label={t("ateOtherTitle")}
          autoFocus
        />
      </ResponsiveDialog>
    </div>
  );
}

function MealRow({
  meal,
  choices,
  onChoose,
  onTick,
  onOther,
}: {
  meal: MealFull;
  choices: Choices;
  onChoose: (group: string, itemId: string) => void;
  onTick: () => void;
  onOther: () => void;
}) {
  const t = useTranslations("meals");
  const fmt = useFmt();
  const name = useLocalName();
  const eaten = meal.log?.status === "eaten";
  const other = meal.log?.status === "ate_other";
  const kcal = chosenItems(meal, choices).reduce((s, { item, food }) => s + food.kcal * item.amount, 0);

  const plain = meal.items.filter(({ item }) => !item.swap_group);
  const groups = [...new Set(meal.items.map(({ item }) => item.swap_group).filter(Boolean))] as string[];

  const amount = (it: MealFull["items"][number]) =>
    it.food.serving_g ? fmt.grams(it.item.amount * it.food.serving_g) : `${fmt.num(it.item.amount)} × ${it.food.serving}`;

  return (
    <AccordionItem value={meal.meal.id} className="mb-3 overflow-hidden rounded-lg border bg-card last:border-b">
      <div className="flex items-center gap-2 pe-3">
        <AccordionTrigger className="flex-1 px-4 py-4 hover:no-underline">
          <span className="flex flex-col items-start gap-0.5 text-start">
            <span className="text-[17px] font-semibold">{meal.meal.name}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{fmt.kcal(kcal)}</span>
          </span>
        </AccordionTrigger>
        <button
          type="button"
          onClick={onTick}
          aria-pressed={eaten}
          aria-label={`${t("markEaten")}: ${meal.meal.name}`}
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full border-2 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            eaten ? "border-transparent bg-fire text-white" : "border-border text-hint hover:border-primary",
          )}
        >
          <CheckIcon className="size-5" strokeWidth={2.5} aria-hidden />
        </button>
      </div>
      <AccordionContent className="flex flex-col gap-3 px-4 pb-4">
        {meal.meal.note && <p className="text-sm text-info">{meal.meal.note}</p>}
        <ul className="flex flex-col gap-2">
          {plain.map((it) => (
            <li key={it.item.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold">{name(it.food)}</span>
              <span className="text-muted-foreground tabular-nums">{amount(it)}</span>
            </li>
          ))}
        </ul>
        {groups.map((group) => {
          const options = meal.items.filter(({ item }) => item.swap_group === group);
          const value = choices[`${meal.meal.id}:${group}`] ?? options[0]!.item.id;
          return (
            <fieldset key={group} className="rounded-md border border-dashed p-3">
              <legend className="px-1 text-xs font-semibold text-muted-foreground">{t("chooseOne")}</legend>
              <RadioGroup value={value} onValueChange={(v) => onChoose(group, v)} className="gap-2">
                {options.map((it, i) => (
                  <div key={it.item.id} className="flex flex-col gap-2">
                    {i > 0 && <span className="text-center text-xs font-bold text-hint">{t("swap")}</span>}
                    <Label htmlFor={it.item.id} className="flex min-h-11 cursor-pointer items-center gap-3 font-normal">
                      <RadioGroupItem id={it.item.id} value={it.item.id} />
                      <span className="flex-1 font-semibold">{name(it.food)}</span>
                      <span className="text-sm text-muted-foreground tabular-nums">{amount(it)}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </fieldset>
          );
        })}
        {other && meal.log?.note && (
          <p className="rounded-md bg-secondary p-3 text-sm">
            <span className="font-semibold">{t("ateOther")}: </span>
            {meal.log.note}
          </p>
        )}
        <Button variant="ghost" size="sm" className="w-fit" onClick={onOther}>
          <MessageSquareTextIcon data-icon="inline-start" />
          {t("ateOther")}
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
}
