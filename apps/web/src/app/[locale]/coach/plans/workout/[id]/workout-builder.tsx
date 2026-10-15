"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { api } from "@coachi/core";
import type { Exercise, ProgramFull } from "@coachi/validation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookmarkPlusIcon,
  ClipboardCopyIcon,
  ClipboardPasteIcon,
  CopyPlusIcon,
  EllipsisVerticalIcon,
  MoonIcon,
  PlusIcon,
  Trash2Icon,
  UsersRoundIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { use, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AssignToClientsDialog } from "@/components/coach/assign-dialogs";
import { SaveIndicator } from "@/components/coach/save-indicator";
import { EXERCISE_DRAG_TYPE, ExercisePicker } from "@/components/coach/exercise-picker";
import { ExerciseRow } from "@/components/coach/exercise-row";
import { QueryState } from "@/components/coachi/query-state";
import { BackLink } from "@/components/coachi/screen-header";
import { EmptyState, ListSkeleton } from "@/components/coachi/states";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMe } from "@/hooks/use-session";
import { useRouter } from "@/i18n/navigation";
import { useAutosave } from "@/lib/use-autosave";
import { useApiErrorToast } from "@/lib/api-error";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import * as ops from "./program-ops";

export function WorkoutBuilder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return id === "new" ? <CreateProgram /> : <LoadProgram id={id} />;
}

/** /new: make a blank template, save it, then continue at its real URL. */
function CreateProgram() {
  const t = useTranslations("plans");
  const router = useRouter();
  const { orgId, coachId } = useMe();
  const showError = useApiErrorToast();
  const created = useRef(false);
  useEffect(() => {
    if (!orgId || !coachId || created.current) return;
    created.current = true;
    const draft = ops.newProgram(orgId, coachId, t("untitledWorkout"));
    void api.training.saveProgram(draft)
      .then((saved) => router.replace(`/coach/plans/workout/${saved.program.id}`))
      .catch((error: unknown) => {
        // Read-only (ended subscription) or not allowed: say why and go back to the plans list.
        showError(error);
        router.replace("/coach/plans");
      });
  }, [orgId, coachId, router, t, showError]);
  return <ListSkeleton />;
}

function LoadProgram({ id }: { id: string }) {
  const program = useQuery({ queryKey: qk.program(id), queryFn: () => api.training.getProgram(id), staleTime: Infinity });
  return <QueryState query={program}>{(data) => <Builder initial={data} />}</QueryState>;
}

function Builder({ initial }: { initial: ProgramFull }) {
  const t = useTranslations("builder");
  const tPlans = useTranslations("plans");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const { coachId } = useMe();
  const [draft, setDraft] = useState(initial);
  const [version, setVersion] = useState(0);
  const [week, setWeek] = useState(1);
  const [dayId, setDayId] = useState(initial.days.find((d) => d.day.week === 1)?.day.id ?? initial.days[0]?.day.id ?? "");
  const [clipboard, setClipboard] = useState<ops.DayFull | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const status = useAutosave(draft, version, async (p) => {
    await api.training.saveProgram(p);
    void queryClient.invalidateQueries({ queryKey: qk.programs(coachId) });
  });

  const edit = (fn: (p: ProgramFull) => ProgramFull) => {
    setDraft(fn);
    setVersion((v) => v + 1);
  };
  /** For removals: apply now, offer Undo for 6 seconds. */
  const editWithUndo = (fn: (p: ProgramFull) => ProgramFull, message: string) => {
    const before = draft;
    edit(fn);
    toast(message, { duration: 6000, action: { label: tCommon("undo"), onClick: () => edit(() => before) } });
  };

  const weekDays = draft.days.filter((d) => d.day.week === week).sort((a, b) => a.day.day - b.day.day);
  const day = draft.days.find((d) => d.day.id === dayId) ?? weekDays[0];
  const weeksWithDays = Math.max(draft.program.weeks, ...draft.days.map((d) => d.day.week));

  const selectWeek = (w: number) => {
    setWeek(w);
    const first = draft.days.find((d) => d.day.week === w);
    setDayId(first?.day.id ?? "");
  };

  const add = (exercise: Exercise) => {
    if (!day) return;
    edit((p) => ops.addExercise(p, day.day.id, exercise));
    setPickerOpen(false);
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = (e: DragEndEvent) => {
    if (!day || !e.over || e.active.id === e.over.id) return;
    const from = day.items.findIndex((x) => x.item.id === e.active.id);
    const to = day.items.findIndex((x) => x.item.id === e.over!.id);
    edit((p) => ops.moveItem(p, day.day.id, from, to));
  };

  const isTemplate = draft.program.client_id === null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <BackLink href="/coach/plans" label={tCommon("back")} />
        <Input
          value={draft.program.name}
          onChange={(e) => edit((p) => ({ ...p, program: { ...p.program, name: e.target.value } }))}
          aria-label={t("name")}
          className="h-11 max-w-md flex-1 border-transparent bg-transparent text-xl font-bold hover:border-border focus-visible:bg-secondary"
        />
        <SaveIndicator status={status} />
        <div className="ms-auto flex gap-2">
          {isTemplate ? (
            <Button variant="secondary" onClick={() => setAssigning(true)}>
              <UsersRoundIcon data-icon="inline-start" />
              {t("assignClient")}
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() =>
                void api.training
                  .saveProgram(ops.copyProgram(draft, { name: draft.program.name, client_id: null }))
                  .then(() => {
                    toast.success(t("templateSaved"));
                    void queryClient.invalidateQueries({ queryKey: qk.programs(coachId) });
                  })
              }
            >
              <BookmarkPlusIcon data-icon="inline-start" />
              {t("saveTemplate")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)_320px]">
        {/* Pane 1: weeks and days (min-w-0 so the phone day strip scrolls instead of widening the page) */}
        <aside className="flex min-w-0 flex-col gap-3">
          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label className="text-xs">{t("weeks")}</Label>
              <Select value={String(week)} onValueChange={(v) => selectWeek(Number(v))}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: weeksWithDays }, (_, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      {t("week", { n: i + 1 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="secondary"
              size="icon"
              aria-label={t("copyWeek")}
              title={t("copyWeek")}
              disabled={weekDays.length === 0}
              onClick={() => {
                edit((p) => ops.copyWeekToNext(p, week));
                toast.success(t("weekCopied"));
              }}
            >
              <CopyPlusIcon />
            </Button>
          </div>
          {/* Phone: day chips in a row. Laptop: a vertical list. */}
          <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {weekDays.map((d) => (
              <li key={d.day.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setDayId(d.day.id)}
                  aria-current={d.day.id === day?.day.id}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2 rounded-md border px-3 text-start text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    d.day.id === day?.day.id ? "border-primary bg-primary/10 font-semibold" : "bg-card hover:border-primary/40",
                  )}
                >
                  <span className="text-xs text-hint tabular-nums">{d.day.day}</span>
                  <span className="truncate">{d.day.rest_day ? t("restDay") : d.day.title || t("day", { n: d.day.day })}</span>
                  {d.day.rest_day ? (
                    <MoonIcon className="ms-auto size-4 text-hint" aria-hidden />
                  ) : (
                    <span className="ms-auto text-xs text-hint tabular-nums">{d.items.length}</span>
                  )}
                </button>
              </li>
            ))}
            <li className="shrink-0">
              <Button
                variant="ghost"
                className="w-full justify-start"
                disabled={weekDays.length >= 7}
                onClick={() => {
                  const { program, dayId: added } = ops.addDay(draft, week);
                  edit(() => program);
                  if (added) setDayId(added);
                }}
              >
                <PlusIcon data-icon="inline-start" />
                {t("addDay")}
              </Button>
            </li>
          </ol>
        </aside>

        {/* Pane 2: the day editor (also a drop target for exercises dragged from the library) */}
        <section
          className="flex min-w-0 flex-col gap-3"
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes(EXERCISE_DRAG_TYPE)) e.preventDefault();
          }}
          onDrop={(e) => {
            const exerciseId = e.dataTransfer.getData(EXERCISE_DRAG_TYPE);
            const exercise = queryClient.getQueryData<Exercise[]>(qk.exercises)?.find((x) => x.id === exerciseId);
            if (exercise) add(exercise);
          }}
        >
          {!day ? (
            <EmptyState icon={PlusIcon} title={t("emptyDay")} />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
                <Input
                  value={day.day.title}
                  placeholder={t("day", { n: day.day.day })}
                  aria-label={t("dayTitle")}
                  onChange={(e) => edit((p) => ops.setDayFields(p, day.day.id, { title: e.target.value }))}
                  className="h-10 min-w-0 flex-1"
                />
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={day.day.rest_day} onCheckedChange={(on) => edit((p) => ops.setDayFields(p, day.day.id, { rest_day: on }))} />
                  {t("restDay")}
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={t("day", { n: day.day.day })}>
                      <EllipsisVerticalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => {
                        setClipboard(day);
                        toast.success(t("dayCopied"));
                      }}
                    >
                      <ClipboardCopyIcon />
                      {t("copyDay")}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={!clipboard || clipboard.day.id === day.day.id} onSelect={() => clipboard && edit((p) => ops.pasteDay(p, clipboard, day.day.id))}>
                      <ClipboardPasteIcon />
                      {t("pasteDay")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => {
                        const remaining = weekDays.filter((d) => d.day.id !== day.day.id);
                        editWithUndo((p) => ops.deleteDay(p, day.day.id), t("deleteDay"));
                        setDayId(remaining[0]?.day.id ?? "");
                      }}
                    >
                      <Trash2Icon />
                      {t("deleteDay")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {day.day.rest_day ? (
                <EmptyState icon={MoonIcon} title={t("restDay")} />
              ) : day.items.length === 0 ? (
                <EmptyState
                  icon={PlusIcon}
                  title={t("emptyDay")}
                  body={t("dragHint")}
                  action={
                    <Button className="lg:hidden" onClick={() => setPickerOpen(true)}>
                      <PlusIcon data-icon="inline-start" />
                      {t("addExercise")}
                    </Button>
                  }
                />
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={day.items.map((x) => x.item.id)} strategy={verticalListSortingStrategy}>
                    <ol className="flex flex-col gap-3">
                      {day.items.map((x, i) => (
                        <li key={x.item.id}>
                          <ExerciseRow
                            item={x.item}
                            exercise={x.exercise}
                            isFirst={i === 0}
                            isLast={i === day.items.length - 1}
                            groupedWithNext={!!x.item.group && day.items[i + 1]?.item.group === x.item.group}
                            onChange={(patch) => edit((p) => ops.patchItem(p, day.day.id, x.item.id, patch))}
                            onMove={(dir) => edit((p) => ops.moveItem(p, day.day.id, i, i + dir))}
                            onGroup={() => edit((p) => ops.groupWithNext(p, day.day.id, i))}
                            onUngroup={() => edit((p) => ops.ungroup(p, day.day.id, x.item.id))}
                            onRemove={() => editWithUndo((p) => ops.removeItem(p, day.day.id, x.item.id), t("removed"))}
                          />
                        </li>
                      ))}
                    </ol>
                  </SortableContext>
                </DndContext>
              )}

              {!day.day.rest_day && day.items.length > 0 && (
                <Button variant="secondary" className="lg:hidden" onClick={() => setPickerOpen(true)}>
                  <PlusIcon data-icon="inline-start" />
                  {t("addExercise")}
                </Button>
              )}
            </>
          )}
        </section>

        {/* Pane 3: exercise library (laptop). On phone it opens in a bottom sheet. */}
        <aside className="hidden lg:block">
          <div className="sticky top-4 flex h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-lg border bg-card">
            <p className="border-b px-3 py-2 text-xs font-bold tracking-[0.12em] text-hint uppercase">{t("library")}</p>
            <ExercisePicker onPick={add} className="flex-1 bg-transparent" />
          </div>
        </aside>
      </div>

      <Drawer open={pickerOpen} onOpenChange={setPickerOpen}>
        <DrawerContent className="h-[85dvh]">
          <DrawerHeader className="text-start">
            <DrawerTitle>{t("addExercise")}</DrawerTitle>
          </DrawerHeader>
          <ExercisePicker onPick={add} className="flex-1 bg-transparent px-2" />
        </DrawerContent>
      </Drawer>

      <AssignToClientsDialog
        kind="workout"
        plan={assigning ? { id: draft.program.id, name: draft.program.name || tPlans("untitledWorkout") } : null}
        onOpenChange={setAssigning}
      />
    </div>
  );
}
