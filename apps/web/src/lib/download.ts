/** Saves text as a file on the phone or laptop (no server round trip). */
export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : Array.isArray(v) ? v.join(" | ") : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV with a BOM so Excel opens Arabic text correctly. */
export function toCsv(header: string[], rows: unknown[][]) {
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}

/** "coachi-clients-2026-10-16.csv" */
export const datedName = (base: string, ext: string) => `${base}-${new Date().toISOString().slice(0, 10)}.${ext}`;
