"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { api } from "@coachi/core";
import type { CheckinForm, CheckinQuestion } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVerticalIcon, Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenHeader, SectionTitle } from "@/components/coachi/screen-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMe } from "@/hooks/use-session";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";

type CfT = ReturnType<typeof useTranslations<"checkinForm">>;

const starterKeys = [
  ["q_energy", "scale"],
  ["q_sleep", "text"],
  ["q_diet", "yes_no"],
  ["q_pain", "text"],
  ["q_win", "text"],
  ["q_stress", "scale"],
  ["q_hunger", "yes_no"],
  ["q_steps", "text"],
] as const;

const starter = (t: CfT): CheckinQuestion[] =>
  starterKeys.slice(0, 5).map(([key, kind]) => ({ id: crypto.randomUUID(), text: t(key), kind }));

export function CheckinFormScreen() {
  const t = useTranslations("checkinForm");
  const { coachId } = useMe();
  const form = useQuery({ queryKey: qk.coachForm(coachId), queryFn: () => api.checkins.form(coachId), enabled: !!coachId });
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title={t("title")} subtitle={t("body")} />
      <QueryState query={form}>{(f) => <FormEditor coachId={coachId} initial={f} />}</QueryState>
    </div>
  );
}

function FormEditor({ coachId, initial }: { coachId: string; initial: CheckinForm | null }) {
  const t = useTranslations("checkinForm");
  const fmt = useFmt();
  const queryClient = useQueryClient();
  // No form yet: a starter set of 5 questions, ready to use.
  const [questions, setQuestions] = useState<CheckinQuestion[]>(() => initial?.questions ?? starter(t));
  const [day, setDay] = useState(initial?.day_of_week ?? 5);
  const [draft, setDraft] = useState<{ text: string; kind: CheckinQuestion["kind"] }>({ text: "", kind: "text" });

  const save = useMutation({
    mutationFn: () => api.checkins.saveForm(coachId, { questions: questions.filter((q) => q.text.trim()), day_of_week: day }),
    onSuccess: () => {
      toast.success(t("saved"));
      void queryClient.invalidateQueries({ queryKey: qk.coachForm(coachId) });
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    setQuestions((qs) => arrayMove(qs, qs.findIndex((q) => q.id === e.active.id), qs.findIndex((q) => q.id === e.over!.id)));
  };

  const unused = starterKeys.filter(([key]) => !questions.some((q) => q.text === t(key)));
  // 2026-10-11 is a Sunday (day 0).
  const dayName = (dow: number) => fmt.weekday(`2026-10-${String(11 + dow).padStart(2, "0")}`);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <SectionTitle>{t("questions")}</SectionTitle>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            <ol className="flex flex-col gap-2">
              {questions.map((q) => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  onChange={(patch) => setQuestions((qs) => qs.map((x) => (x.id === q.id ? { ...x, ...patch } : x)))}
                  onRemove={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>

        <form
          className="flex flex-col gap-2 rounded-lg border border-dashed p-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.text.trim()) return;
            setQuestions((qs) => [...qs, { id: crypto.randomUUID(), text: draft.text.trim(), kind: draft.kind }]);
            setDraft({ text: "", kind: "text" });
          }}
        >
          <Input value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} placeholder={t("write")} aria-label={t("questionText")} />
          <KindSelect value={draft.kind} onChange={(kind) => setDraft({ ...draft, kind })} />
          <Button type="submit" variant="secondary" disabled={!draft.text.trim()}>
            <PlusIcon data-icon="inline-start" />
            {t("addQuestion")}
          </Button>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ci-day">{t("day")}</Label>
          <Select value={String(day)} onValueChange={(v) => setDay(Number(v))}>
            <SelectTrigger id="ci-day" className="h-12 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[6, 0, 1, 2, 3, 4, 5].map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {dayName(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {unused.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionTitle className="mb-0">{t("fromList")}</SectionTitle>
            {unused.map(([key, kind]) => (
              <Button
                key={key}
                variant="ghost"
                className="h-auto justify-start py-2 text-start whitespace-normal"
                onClick={() => setQuestions((qs) => [...qs, { id: crypto.randomUUID(), text: t(key), kind }])}
              >
                <PlusIcon data-icon="inline-start" />
                {t(key)}
              </Button>
            ))}
          </div>
        )}
        <Button size="lg" className="w-fit" disabled={save.isPending || questions.length === 0} onClick={() => save.mutate()}>
          {save.isPending && <Loader2Icon className="animate-spin" />}
          {t("save")}
        </Button>
      </section>
    </div>
  );
}

function KindSelect({ value, onChange }: { value: CheckinQuestion["kind"]; onChange: (kind: CheckinQuestion["kind"]) => void }) {
  const t = useTranslations("checkinForm");
  return (
    <Select value={value} onValueChange={(v) => onChange(v as CheckinQuestion["kind"])}>
      <SelectTrigger className="h-12 w-full sm:w-40" aria-label={t("kind")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(["text", "scale", "yes_no"] as const).map((k) => (
          <SelectItem key={k} value={k}>
            {t(`kind_${k}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function QuestionRow({
  question,
  onChange,
  onRemove,
}: {
  question: CheckinQuestion;
  onChange: (patch: Partial<CheckinQuestion>) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("checkinForm");
  const tB = useTranslations("builder");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, transition }}
      className={`flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center ${isDragging ? "z-10 shadow-lg" : ""}`}
    >
      <div className="flex flex-1 items-center gap-2">
        <button type="button" className="grid size-9 shrink-0 cursor-grab touch-none place-items-center rounded-md text-hint hover:bg-accent" aria-label={tB("drag")} {...attributes} {...listeners}>
          <GripVerticalIcon className="size-5" aria-hidden />
        </button>
        <Input value={question.text} onChange={(e) => onChange({ text: e.target.value })} aria-label={t("questionText")} className="h-10" />
      </div>
      <div className="flex items-center gap-2">
        <KindSelect value={question.kind} onChange={(kind) => onChange({ kind })} />
        <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label={t("remove")} onClick={onRemove}>
          <Trash2Icon />
        </Button>
      </div>
    </li>
  );
}
