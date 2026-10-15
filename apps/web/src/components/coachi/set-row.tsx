"use client";

import { CheckIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFmt } from "@/lib/format";
import { cn } from "@/lib/utils";

type Last = { weight_kg: number | null; reps: number | null } | undefined;

/** One set: weight and reps with big +/- buttons, last time's numbers, and a Done check. */
export function SetRow({
  setNo,
  last,
  weight,
  reps,
  done,
  onWeight,
  onReps,
  onDone,
}: {
  setNo: number;
  last: Last;
  weight: number | null;
  reps: number | null;
  done: boolean;
  onWeight: (value: number) => void;
  onReps: (value: number) => void;
  onDone: () => void;
}) {
  const t = useTranslations("parts");
  const fmt = useFmt();
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-card p-3 transition-colors",
        done && "border-success/40 bg-success/5",
      )}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold">{t("set", { n: setNo })}</span>
        <span className="text-hint tabular-nums">
          {last?.weight_kg != null && last.reps != null
            ? t("last", { weight: fmt.kg(last.weight_kg), reps: fmt.num(last.reps) })
            : t("noLast")}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Stepper
          label={t("weight")}
          value={weight}
          step={2.5}
          decimal
          onChange={onWeight}
          disabled={done}
        />
        <Stepper label={t("reps")} value={reps} step={1} onChange={onReps} disabled={done} />
        <button
          type="button"
          onClick={onDone}
          aria-pressed={done}
          aria-label={t("markDone", { n: setNo })}
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-md border-2 transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
            done ? "border-transparent bg-fire text-white" : "border-border text-hint hover:border-primary",
          )}
        >
          <CheckIcon className="size-6" strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  step,
  decimal,
  disabled,
  onChange,
}: {
  label: string;
  value: number | null;
  step: number;
  decimal?: boolean;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const t = useTranslations("parts");
  const current = value ?? 0;
  const btn =
    "grid size-11 shrink-0 place-items-center rounded-md bg-secondary text-foreground hover:bg-accent disabled:text-disabled focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";
  return (
    // Numbers never flip: − value + reads the same in Arabic and English.
    <div className="flex min-w-0 flex-1 items-center gap-1" dir="ltr">
      <button
        type="button"
        className={btn}
        disabled={disabled || current <= 0}
        onClick={() => onChange(Math.max(0, +(current - step).toFixed(2)))}
        aria-label={t("less", { what: label })}
      >
        <MinusIcon className="size-5" aria-hidden />
      </button>
      <input
        aria-label={label}
        inputMode={decimal ? "decimal" : "numeric"}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => {
          const parsed = Number(e.target.value.replace(",", "."));
          if (!Number.isNaN(parsed)) onChange(parsed);
        }}
        className="h-11 w-full min-w-0 rounded-sm border bg-secondary text-center text-lg font-bold tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:bg-transparent disabled:border-transparent"
      />
      <button
        type="button"
        className={btn}
        disabled={disabled}
        onClick={() => onChange(+(current + step).toFixed(2))}
        aria-label={t("more", { what: label })}
      >
        <PlusIcon className="size-5" aria-hidden />
      </button>
    </div>
  );
}
