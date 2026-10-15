"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@coachi/core";
import { activityLevel, budgetLevel, gender, goal, trainingPlace, type ClientDetails, type Client } from "@coachi/validation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CircleCheckBigIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { Controller, useForm, type Control, type FieldPath } from "react-hook-form";
import { z } from "zod";
import { FieldError } from "@/components/coachi/field-error";
import { QueryState } from "@/components/coachi/query-state";
import { EmptyState } from "@/components/coachi/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useMe } from "@/hooks/use-session";
import { useRouter } from "@/i18n/navigation";
import { useFmt } from "@/lib/format";

/** Text inputs hold strings; this turns "" into null and "62,5" into 62.5. */
const optionalNumber = (min: number, max: number) =>
  z
    .string()
    .transform((v) => (v.trim() === "" ? null : Number(v.replace(",", "."))))
    .refine((v) => v === null || (!Number.isNaN(v) && v >= min && v <= max), "range");

const requiredNumber = (min: number, max: number) =>
  z.string().refine((v) => {
    const n = Number(v.replace(",", "."));
    return v.trim() !== "" && !Number.isNaN(n) && n >= min && n <= max;
  }, "range");

const schema = z.object({
  goal,
  target_weight: optionalNumber(30, 250),
  training_days: z.array(z.number()).min(1, "days"),
  place: trainingPlace,
  age: requiredNumber(10, 100),
  gender,
  height: requiredNumber(100, 230),
  weight: requiredNumber(30, 300),
  activity: activityLevel,
  injuries: z.string(),
  health_notes: z.string(),
  medicines: z.string(),
  past_training: z.string(),
  food_likes: z.string(),
  food_dislikes: z.string(),
  food_never: z.string(),
  meals_per_day: z.string(),
  budget: budgetLevel,
  cooks: z.enum(["yes", "no"]),
  supplements: z.string(),
});
type FormIn = z.input<typeof schema>;
type FormOut = z.output<typeof schema>;
type FormControl = Control<FormIn, unknown, FormOut>;

const steps: FieldPath<FormIn>[][] = [
  ["goal", "target_weight", "training_days", "place"],
  ["age", "gender", "height", "weight", "activity"],
  ["injuries", "health_notes", "medicines", "past_training"],
  ["food_likes", "food_dislikes", "food_never", "meals_per_day", "budget", "cooks", "supplements"],
];
const stepNames = ["goal", "body", "health", "food"] as const;

const STEP_KEY = "coachi.intake.step";
const readStep = () => {
  try {
    return Math.min(3, Number(localStorage.getItem(STEP_KEY) ?? 0) || 0);
  } catch {
    return 0;
  }
};

const str = (v: number | string | null | undefined) => (v == null ? "" : String(v));

function defaults(client: Client, d: ClientDetails | null): FormIn {
  return {
    goal: client.goal ?? "fat_loss",
    target_weight: str(client.target_weight_kg),
    training_days: d?.training_days ?? [],
    place: d?.place ?? "gym",
    age: str(d?.age),
    gender: d?.gender ?? "male",
    height: str(d?.height_cm),
    weight: str(d?.start_weight_kg),
    activity: d?.activity ?? "light",
    injuries: d?.injuries ?? "",
    health_notes: d?.health_notes ?? "",
    medicines: d?.medicines ?? "",
    past_training: d?.past_training ?? "",
    food_likes: d?.food_likes ?? "",
    food_dislikes: d?.food_dislikes ?? "",
    food_never: d?.food_never ?? "",
    meals_per_day: str(d?.meals_per_day ?? 4),
    budget: d?.budget ?? "medium",
    cooks: d?.cooks_at_home === false ? "no" : "yes",
    supplements: d?.supplements ?? "",
  };
}

export function IntakeScreen() {
  const { clientId } = useMe();
  const mine = useQuery({ queryKey: ["my-details", clientId], queryFn: () => api.clients.myDetails(clientId), enabled: !!clientId });
  return <QueryState query={mine}>{(data) => <IntakeForm clientId={clientId} initial={defaults(data.client, data.details)} />}</QueryState>;
}

function IntakeForm({ clientId, initial }: { clientId: string; initial: FormIn }) {
  const t = useTranslations("intake");
  const tCommon = useTranslations("common");
  const router = useRouter();
  // Resume where he stopped (stored per phone).
  const storedStep = useSyncExternalStore(() => () => {}, readStep, () => 0);
  const [stepOverride, setStepOverride] = useState<number | null>(null);
  const step = stepOverride ?? storedStep;
  const setStep = (n: number) => {
    setStepOverride(n);
    try {
      localStorage.setItem(STEP_KEY, String(n));
    } catch {
      // ignore
    }
  };
  const [finished, setFinished] = useState(false);

  const form = useForm<FormIn, unknown, FormOut>({ resolver: zodResolver(schema), defaultValues: initial, mode: "onTouched" });
  const { control, register, formState, trigger, getValues } = form;
  const err = (name: FieldPath<FormIn>) => formState.errors[name as keyof FormIn];

  const save = useMutation({
    mutationFn: async (stepIndex: number) => {
      const v = schema.parse(getValues());
      if (stepIndex === 0) {
        await api.clients.updateMyGoal(clientId, { goal: v.goal, target_weight_kg: v.target_weight });
      }
      const patch: Partial<ClientDetails> = [
        { training_days: v.training_days, place: v.place },
        { age: Number(v.age), gender: v.gender, height_cm: Number(v.height), start_weight_kg: Number(v.weight.replace(",", ".")), activity: v.activity },
        { injuries: v.injuries || null, health_notes: v.health_notes || null, medicines: v.medicines || null, past_training: v.past_training || null },
        {
          food_likes: v.food_likes || null,
          food_dislikes: v.food_dislikes || null,
          food_never: v.food_never || null,
          meals_per_day: Number(v.meals_per_day) || null,
          budget: v.budget,
          cooks_at_home: v.cooks === "yes",
          supplements: v.supplements || null,
          intake_completed_at: new Date().toISOString(),
        },
      ][stepIndex]!;
      await api.clients.updateDetails(clientId, patch);
    },
  });

  const next = async () => {
    if (!(await trigger(steps[step]))) return;
    await save.mutateAsync(step);
    if (step < 3) setStep(step + 1);
    else {
      setStep(0);
      setFinished(true);
    }
  };

  if (finished) {
    return (
      <EmptyState
        icon={CircleCheckBigIcon}
        title={t("doneTitle")}
        body={t("doneBody")}
        className="mt-10 border-solid border-success/40"
        action={<Button onClick={() => router.replace("/app/today")}>{tCommon("next")}</Button>}
      />
    );
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        void next();
      }}
      noValidate
    >
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-muted-foreground">{t("step", { n: step + 1 })}</span>
          <span className="font-semibold">{t(`steps.${stepNames[step]!}`)}</span>
        </div>
        <Progress value={((step + 1) / 4) * 100} aria-label={t("step", { n: step + 1 })} />
        <h1 className="font-display text-[32px] leading-[1.1] uppercase">{t("title")}</h1>
      </header>

      {step === 0 && (
        <>
          <Choice control={control} name="goal" label={t("goalQ")} options={goal.options.map((g) => [g, `goalName.${g}`])} parts cols={2} />
          <NumberField id="target_weight" label={t("targetWeight")} error={!!err("target_weight")} {...register("target_weight")} />
          <DaysField control={control} label={t("trainingDays")} error={!!err("training_days")} />
          <Choice
            control={control}
            name="place"
            label={t("place")}
            options={[["gym", "placeGym"], ["home", "placeHome"], ["both", "placeBoth"]]}
          />
        </>
      )}
      {step === 1 && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <NumberField id="age" label={t("age")} numeric error={!!err("age")} {...register("age")} />
            <NumberField id="height" label={t("height")} numeric error={!!err("height")} {...register("height")} />
          </div>
          <Choice control={control} name="gender" label={t("gender")} options={[["male", "male"], ["female", "female"]]} />
          <NumberField id="weight" label={t("weight")} error={!!err("weight")} {...register("weight")} />
          <Choice
            control={control}
            name="activity"
            label={t("activity")}
            cols={2}
            options={activityLevel.options.map((a) => [a, `activity_${a}`])}
          />
        </>
      )}
      {step === 2 && (
        <>
          <TextField id="injuries" label={t("injuries")} placeholder={t("injuriesPlaceholder")} {...register("injuries")} />
          <TextField id="health_notes" label={t("conditions")} {...register("health_notes")} />
          <TextField id="medicines" label={t("medicines")} {...register("medicines")} />
          <TextField id="past_training" label={t("pastTraining")} {...register("past_training")} />
        </>
      )}
      {step === 3 && (
        <>
          <TextField id="food_likes" label={t("likes")} {...register("food_likes")} />
          <TextField id="food_dislikes" label={t("dislikes")} {...register("food_dislikes")} />
          <TextField id="food_never" label={t("never")} {...register("food_never")} />
          <Choice control={control} name="meals_per_day" label={t("mealsPerDay")} options={["2", "3", "4", "5", "6"].map((n) => [n, n])} raw />
          <Choice control={control} name="budget" label={t("budget")} options={budgetLevel.options.map((b) => [b, `budget_${b}`])} />
          <Choice control={control} name="cooks" label={t("cooks")} options={[["yes", "yes"], ["no", "no"]]} checkin />
          <TextField id="supplements" label={t("supplements")} {...register("supplements")} />
        </>
      )}

      <footer className="sticky bottom-0 -mx-4 flex gap-2 border-t bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {step > 0 && (
          <Button type="button" variant="secondary" onClick={() => setStep(step - 1)}>
            {tCommon("back")}
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={save.isPending}>
          {save.isPending && <Loader2Icon className="animate-spin" />}
          {step === 3 ? t("finish") : tCommon("next")}
        </Button>
      </footer>
    </form>
  );
}

function NumberField({
  id,
  label,
  error,
  numeric,
  ...input
}: React.ComponentProps<"input"> & { id: string; label: string; error: boolean; numeric?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} dir="ltr" inputMode={numeric ? "numeric" : "decimal"} aria-invalid={error} className="tabular-nums" {...input} />
      {error && <RangeError />}
    </div>
  );
}

function RangeError() {
  const t = useTranslations("checkin");
  return <FieldError>{t("required")}</FieldError>;
}

function TextField({ id, label, ...input }: React.ComponentProps<"textarea"> & { id: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} {...input} />
    </div>
  );
}

/** Single-choice chips. Labels come from intake.* (or parts.* / checkin.* / raw values). */
function Choice({
  control,
  name,
  label,
  options,
  cols,
  parts,
  raw,
  checkin,
}: {
  control: FormControl;
  name: FieldPath<FormIn>;
  label: string;
  options: [string, string][];
  cols?: number;
  parts?: boolean;
  raw?: boolean;
  checkin?: boolean;
}) {
  const t = useTranslations("intake");
  const tParts = useTranslations("parts");
  const tCheckin = useTranslations("checkin");
  const text = (key: string) =>
    raw ? key : parts ? tParts(key as Parameters<typeof tParts>[0]) : checkin ? tCheckin(key as Parameters<typeof tCheckin>[0]) : t(key as Parameters<typeof t>[0]);
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <ToggleGroup
            type="single"
            variant="outline"
            value={String(field.value)}
            onValueChange={(v) => v && field.onChange(v)}
            className="grid w-full"
            style={{ gridTemplateColumns: `repeat(${cols ?? options.length}, minmax(0, 1fr))` }}
          >
            {options.map(([value, key]) => (
              <ToggleGroupItem key={value} value={value} className="h-11">
                {text(key)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      />
    </div>
  );
}

/** Saturday-first week, as in Egypt. */
const weekOrder = [6, 0, 1, 2, 3, 4, 5];

function DaysField({ control, label, error }: { control: FormControl; label: string; error: boolean }) {
  const fmt = useFmt();
  // 2026-10-11 is a Sunday (day 0), so 11 + dow is a date with that weekday.
  const dayName = (dow: number) => fmt.weekday(`2026-10-${String(11 + dow).padStart(2, "0")}`);
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Controller
        control={control}
        name="training_days"
        render={({ field }) => (
          <ToggleGroup
            type="multiple"
            variant="outline"
            value={(field.value as number[]).map(String)}
            onValueChange={(v) => field.onChange(v.map(Number))}
            className="grid w-full grid-cols-7"
          >
            {weekOrder.map((dow) => (
              <ToggleGroupItem key={dow} value={String(dow)} className="h-11 px-0 text-xs">
                {dayName(dow)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      />
      {error && <RangeError />}
    </div>
  );
}
