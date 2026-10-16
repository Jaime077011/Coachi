/**
 * Keeps the mock database in localStorage, so a page reload doesn't undo what you did
 * (a sent request, a finished workout). Bump VERSION when the seed data changes shape.
 */
import * as data from "./data";
import { onMockWrite } from "./runtime";

const VERSION = 6;
const KEY = `coachi.mock.db.v${VERSION}`;

const tables = Object.entries(data as Record<string, unknown>).filter(
  (entry): entry is [string, unknown[]] => Array.isArray(entry[1]),
);

function restore() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as Record<string, unknown[]>;
    for (const [name, rows] of tables) {
      const stored = saved[name];
      if (Array.isArray(stored)) rows.splice(0, rows.length, ...stored);
    }
  } catch {
    // Corrupt or blocked storage: keep the seed data.
  }
}

let timer: ReturnType<typeof setTimeout> | null = null;
function save() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      globalThis.localStorage?.setItem(KEY, JSON.stringify(Object.fromEntries(tables)));
    } catch {
      // Storage full or blocked: changes still live until reload.
    }
  }, 200);
}

/** Dev switcher "Reset demo data". */
export function resetMockDatabase() {
  try {
    globalThis.localStorage?.removeItem(KEY);
  } catch {
    // ignore
  }
}

if (typeof window !== "undefined") {
  restore();
  onMockWrite(save);
}
