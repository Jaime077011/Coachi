import type { Exercise, ProgramDay, ProgramExercise, ProgramFull } from "@coachi/validation";

/** Pure helpers for editing a ProgramFull draft. Every edit returns a new object. */

const stamp = () => {
  const now = new Date().toISOString();
  return { created_at: now, updated_at: now, deleted_at: null };
};

export type DayFull = ProgramFull["days"][number];

export function newProgram(orgId: string, coachId: string, name: string): ProgramFull {
  const id = crypto.randomUUID();
  return {
    program: { ...stamp(), id, org_id: orgId, coach_id: coachId, client_id: null, name, weeks: 4, starts_on: null, version: 1 },
    days: [newDay(id, 1, 1, "")],
  };
}

export function newDay(programId: string, week: number, day: number, title: string): DayFull {
  return { day: { ...stamp(), id: crypto.randomUUID(), program_id: programId, week, day, title, rest_day: false }, items: [] };
}

export function newItem(dayId: string, exercise: Exercise, order: number): DayFull["items"][number] {
  return {
    exercise,
    item: {
      ...stamp(),
      id: crypto.randomUUID(),
      program_day_id: dayId,
      exercise_id: exercise.id,
      order,
      sets: 3,
      reps: "8-12",
      rest_sec: 90,
      target: null,
      tempo: null,
      note: null,
      group: null,
    },
  };
}

const reorder = (items: DayFull["items"]) => items.map((x, i) => ({ ...x, item: { ...x.item, order: i } }));

export function updateDay(p: ProgramFull, dayId: string, fn: (d: DayFull) => DayFull): ProgramFull {
  return { ...p, days: p.days.map((d) => (d.day.id === dayId ? fn(d) : d)) };
}

export function setDayFields(p: ProgramFull, dayId: string, patch: Partial<Pick<ProgramDay, "title" | "rest_day">>) {
  return updateDay(p, dayId, (d) => ({ ...d, day: { ...d.day, ...patch } }));
}

export function addExercise(p: ProgramFull, dayId: string, exercise: Exercise) {
  return updateDay(p, dayId, (d) => ({ ...d, day: { ...d.day, rest_day: false }, items: [...d.items, newItem(dayId, exercise, d.items.length)] }));
}

export function patchItem(p: ProgramFull, dayId: string, itemId: string, patch: Partial<ProgramExercise>) {
  return updateDay(p, dayId, (d) => ({ ...d, items: d.items.map((x) => (x.item.id === itemId ? { ...x, item: { ...x.item, ...patch } } : x)) }));
}

export function removeItem(p: ProgramFull, dayId: string, itemId: string) {
  return updateDay(p, dayId, (d) => ({ ...d, items: reorder(d.items.filter((x) => x.item.id !== itemId)) }));
}

export function moveItem(p: ProgramFull, dayId: string, from: number, to: number) {
  return updateDay(p, dayId, (d) => {
    if (to < 0 || to >= d.items.length) return d;
    const items = [...d.items];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved!);
    return { ...d, items: reorder(items) };
  });
}

/** Group an exercise with the next one as a superset (same letter). */
export function groupWithNext(p: ProgramFull, dayId: string, index: number) {
  return updateDay(p, dayId, (d) => {
    const next = d.items[index + 1];
    if (!next) return d;
    const used = new Set(d.items.map((x) => x.item.group).filter(Boolean));
    const letter = next.item.group ?? d.items[index]!.item.group ?? "ABCDEFGH".split("").find((l) => !used.has(l)) ?? "A";
    return {
      ...d,
      items: d.items.map((x, i) => (i === index || i === index + 1 ? { ...x, item: { ...x.item, group: letter } } : x)),
    };
  });
}

export function ungroup(p: ProgramFull, dayId: string, itemId: string) {
  return updateDay(p, dayId, (d) => {
    const letter = d.items.find((x) => x.item.id === itemId)?.item.group;
    const remaining = d.items.filter((x) => x.item.group === letter && x.item.id !== itemId);
    return {
      ...d,
      // A superset of one isn't a superset: clear the last partner too.
      items: d.items.map((x) =>
        x.item.id === itemId || (remaining.length === 1 && x.item.id === remaining[0]!.item.id) ? { ...x, item: { ...x.item, group: null } } : x,
      ),
    };
  });
}

function cloneDay(source: DayFull, target: { programId: string; week: number; day: number }): DayFull {
  const id = crypto.randomUUID();
  return {
    day: { ...source.day, ...stamp(), id, program_id: target.programId, week: target.week, day: target.day },
    items: source.items.map((x) => ({ ...x, item: { ...x.item, ...stamp(), id: crypto.randomUUID(), program_day_id: id } })),
  };
}

export function addDay(p: ProgramFull, week: number): { program: ProgramFull; dayId: string | null } {
  const inWeek = p.days.filter((d) => d.day.week === week);
  if (inWeek.length >= 7) return { program: p, dayId: null };
  const n = Math.max(0, ...inWeek.map((d) => d.day.day)) + 1;
  const day = newDay(p.program.id, week, n, "");
  return { program: { ...p, days: [...p.days, day] }, dayId: day.day.id };
}

export function deleteDay(p: ProgramFull, dayId: string): ProgramFull {
  const target = p.days.find((d) => d.day.id === dayId);
  if (!target) return p;
  // Renumber the remaining days of that week so they stay 1..n.
  let n = 0;
  return {
    ...p,
    days: p.days
      .filter((d) => d.day.id !== dayId)
      .sort((a, b) => a.day.week - b.day.week || a.day.day - b.day.day)
      .map((d) => (d.day.week === target.day.week ? { ...d, day: { ...d.day, day: ++n } } : d)),
  };
}

/** Paste: replace the target day's exercises (and title) with a copy of the source day. */
export function pasteDay(p: ProgramFull, source: DayFull, targetDayId: string): ProgramFull {
  const target = p.days.find((d) => d.day.id === targetDayId);
  if (!target) return p;
  const copy = cloneDay(source, { programId: p.program.id, week: target.day.week, day: target.day.day });
  return { ...p, days: p.days.map((d) => (d.day.id === targetDayId ? { ...copy, day: { ...copy.day, id: targetDayId }, items: copy.items.map((x) => ({ ...x, item: { ...x.item, program_day_id: targetDayId } })) } : d)) };
}

/** Copy every day of a week into the next week (replacing what was there). */
export function copyWeekToNext(p: ProgramFull, week: number): ProgramFull {
  const next = week + 1;
  const copies = p.days.filter((d) => d.day.week === week).map((d) => cloneDay(d, { programId: p.program.id, week: next, day: d.day.day }));
  return {
    program: { ...p.program, weeks: Math.max(p.program.weeks, next) },
    days: [...p.days.filter((d) => d.day.week !== next), ...copies],
  };
}

/** A fresh copy with new ids, e.g. "Save as template" from a client's plan. */
export function copyProgram(p: ProgramFull, overrides: { name: string; client_id: string | null }): ProgramFull {
  const id = crypto.randomUUID();
  return {
    program: { ...p.program, ...stamp(), id, name: overrides.name, client_id: overrides.client_id, starts_on: null, version: 1 },
    days: p.days.map((d) => cloneDay(d, { programId: id, week: d.day.week, day: d.day.day })),
  };
}
