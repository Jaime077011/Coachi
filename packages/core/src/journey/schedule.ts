import type { ProgramDay } from "@coachi/validation";
import { programDays, programs } from "../mock/data";

/**
 * The client's program day for a date. Weeks run in order from starts_on and loop after the
 * last one; a week the coach hasn't filled falls back to week 1.
 */
export function programDayFor(clientId: string, date: string): ProgramDay | null {
  const program = programs.find((p) => p.client_id === clientId && !p.deleted_at);
  if (!program?.starts_on) return null;
  const since = Math.floor((Date.parse(date) - Date.parse(program.starts_on)) / 86_400_000);
  if (since < 0) return null;
  return dayInProgram(programDays.filter((d) => d.program_id === program.id), program.weeks, since);
}

/** Shared by the API and the client's week view: day `since` (0 = start) of a program. */
export function dayInProgram<T extends Pick<ProgramDay, "week" | "day">>(days: T[], weeks: number, since: number): T | null {
  const week = (Math.floor(since / 7) % Math.max(1, weeks)) + 1;
  const ofWeek = (w: number) => days.filter((d) => d.week === w).sort((a, b) => a.day - b.day);
  const list = ofWeek(week).length ? ofWeek(week) : ofWeek(1);
  if (list.length === 0) return null;
  // Days are a 7-day cycle when the week is full; shorter weeks repeat their own days.
  return list.length === 7 ? (list[since % 7] ?? null) : (list[since % list.length] ?? null);
}

export function isTrainingDay(clientId: string, date: string) {
  const day = programDayFor(clientId, date);
  return day ? !day.rest_day : false;
}
