"use client";

import { useSortable } from "@dnd-kit/sortable";
import type { Exercise, ProgramExercise } from "@coachi/validation";
import { ArrowDownIcon, ArrowUpIcon, EllipsisVerticalIcon, GripVerticalIcon, Link2Icon, Link2OffIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useLocalName } from "@/lib/format";
import { cn } from "@/lib/utils";

type Patch = Partial<Pick<ProgramExercise, "sets" | "reps" | "rest_sec" | "target" | "tempo" | "note">>;

/** One exercise in the builder: sets, reps, rest, target, tempo, note; drag handle; superset line. */
export function ExerciseRow({
  item,
  exercise,
  isFirst,
  isLast,
  groupedWithNext,
  notInGym,
  onChange,
  onMove,
  onGroup,
  onUngroup,
  onRemove,
}: {
  item: ProgramExercise;
  exercise: Exercise;
  isFirst: boolean;
  isLast: boolean;
  groupedWithNext: boolean;
  /** The client's gym doesn't have what this exercise needs. */
  notInGym?: boolean;
  onChange: (patch: Patch) => void;
  onMove: (dir: -1 | 1) => void;
  onGroup: () => void;
  onUngroup: () => void;
  onRemove: () => void;
}) {
  const t = useTranslations("builder");
  const tGym = useTranslations("gym");
  const name = useLocalName();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  const field = "h-10 text-center tabular-nums";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative rounded-lg border bg-card p-3",
        isDragging && "z-10 shadow-lg ring-2 ring-primary/40",
        item.group && "border-s-4 border-s-primary",
      )}
    >
      {/* Superset line joining this row to the next one. */}
      {groupedWithNext && <span className="absolute -bottom-3 start-[-4px] h-3 w-1 bg-primary" aria-hidden />}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="grid size-9 shrink-0 cursor-grab touch-none place-items-center rounded-md text-hint hover:bg-accent active:cursor-grabbing"
          aria-label={t("drag")}
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-5" aria-hidden />
        </button>
        <p className="min-w-0 flex-1 truncate font-semibold">{name(exercise)}</p>
        {notInGym && (
          <Badge variant="outline" className="border-warning/40 text-warning">
            {tGym("notInGym")}
          </Badge>
        )}
        {item.group && (
          <Badge variant="outline" className="border-primary/40 text-primary">
            {t("group")} {item.group}
          </Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={name(exercise)}>
              <EllipsisVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={isFirst} onSelect={() => onMove(-1)}>
              <ArrowUpIcon />
              {t("moveUp")}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={isLast} onSelect={() => onMove(1)}>
              <ArrowDownIcon />
              {t("moveDown")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {item.group ? (
              <DropdownMenuItem onSelect={onUngroup}>
                <Link2OffIcon />
                {t("ungroup")}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled={isLast} onSelect={onGroup}>
                <Link2Icon />
                {t("groupWith")}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onRemove}>
              <Trash2Icon />
              {t("remove")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5" dir="ltr">
        <Labeled label={t("sets")}>
          <Input
            className={field}
            inputMode="numeric"
            value={item.sets}
            onChange={(e) => onChange({ sets: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
          />
        </Labeled>
        <Labeled label={t("reps")}>
          <Input className={field} value={item.reps} onChange={(e) => onChange({ reps: e.target.value.slice(0, 20) || "1" })} />
        </Labeled>
        <Labeled label={t("rest")}>
          <Input
            className={field}
            inputMode="numeric"
            value={item.rest_sec}
            onChange={(e) => onChange({ rest_sec: Math.max(0, Math.min(600, Number(e.target.value) || 0)) })}
          />
        </Labeled>
        <Labeled label={t("target")}>
          <Input className={field} value={item.target ?? ""} onChange={(e) => onChange({ target: e.target.value || null })} />
        </Labeled>
        <Labeled label={t("tempo")}>
          <Input className={field} value={item.tempo ?? ""} placeholder="3-1-1" onChange={(e) => onChange({ tempo: e.target.value || null })} />
        </Labeled>
      </div>
      <Input
        className="mt-2 h-10"
        value={item.note ?? ""}
        placeholder={t("note")}
        aria-label={t("note")}
        onChange={(e) => onChange({ note: e.target.value || null })}
      />
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-center text-[11px] font-semibold text-hint">{label}</span>
      {children}
    </label>
  );
}
