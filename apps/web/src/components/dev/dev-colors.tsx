"use client";

import { CopyIcon, PaletteIcon, RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Mock mode only: try brand colors live. Each control is a role that sets every token sharing it
 * (e.g. Red also sets the focus ring and the sidebar highlight), separately for dark and light.
 * Kept in this browser; "Copy CSS" gives the overrides to paste into packages/tokens/theme.css.
 */
const roles = {
  background: ["--background"],
  card: ["--card", "--popover"],
  text: ["--foreground", "--card-foreground", "--popover-foreground", "--secondary-foreground", "--accent-foreground", "--sidebar-foreground", "--sidebar-accent-foreground"],
  primary: ["--primary", "--ring", "--sidebar-primary", "--sidebar-ring", "--chart-1"],
  secondary: ["--secondary", "--muted", "--accent", "--sidebar-accent"],
  border: ["--border", "--input", "--sidebar-border"],
  sidebar: ["--sidebar"],
  hint: ["--hint", "--muted-foreground"],
  success: ["--success", "--chart-3"],
} as const;
type Role = keyof typeof roles;
type Mode = "light" | "dark";
type Overrides = Record<Mode, Partial<Record<Role, string>>>;

const KEY = "coachi.dev.colors";
const EVENT = "coachi:dev-colors";
const STYLE_ID = "coachi-dev-colors";
const empty: Overrides = { light: {}, dark: {} };

let cache: { raw: string | null; value: Overrides } = { raw: null, value: empty };
function read(): Overrides {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cache.raw) cache = { raw, value: raw ? { ...empty, ...(JSON.parse(raw) as Overrides) } : empty };
  } catch {
    // Blocked storage: no overrides.
  }
  return cache.value;
}
function write(next: Overrides) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(EVENT));
}

/** The CSS that applies the overrides; html.dark / html:not(.dark) beat theme.css's .dark / :root. */
function toCss(o: Overrides, selectors = { light: "html:not(.dark)", dark: "html.dark" }) {
  return (["light", "dark"] as const)
    .map((mode) => {
      const lines = (Object.entries(o[mode]) as [Role, string][]).flatMap(([role, value]) => roles[role].map((v) => `  ${v}: ${value};`));
      return lines.length ? `${selectors[mode]} {\n${lines.join("\n")}\n}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

function useOverrides() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENT, cb);
      return () => window.removeEventListener(EVENT, cb);
    },
    read,
    () => empty,
  );
}

/** Always mounted with the dev switcher, so the colors apply on every page, not only while editing. */
export function useDevColors() {
  const overrides = useOverrides();
  useEffect(() => {
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      document.head.appendChild(el);
    }
    el.textContent = toCss(overrides);
  }, [overrides]);
}

/** CSS color → #rrggbb for the swatch (alpha dropped there; the text box keeps the full value). */
function toHex(color: string) {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) return `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
  // #rrggbb, or #rrggbbaa (see-through colors): the swatch shows the color without the alpha.
  return /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(color) ? color.slice(0, 7) : "#000000";
}

export function DevColors() {
  const t = useTranslations("dev");
  const { resolvedTheme } = useTheme();
  const mode: Mode = resolvedTheme === "light" ? "light" : "dark";
  const overrides = useOverrides();
  const [open, setOpen] = useState(false);
  // What theme.css gives, read from the page (re-read when the theme or an override changes).
  const [computed, setComputed] = useState<Partial<Record<Role, string>>>({});
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the live CSS after it changes
    setComputed(Object.fromEntries((Object.keys(roles) as Role[]).map((r) => [r, css.getPropertyValue(roles[r][0]).trim()])));
  }, [mode, overrides, open]);

  const set = (role: Role, value: string) => write({ ...overrides, [mode]: { ...overrides[mode], [role]: value } });
  const changed = Object.keys(overrides.light).length + Object.keys(overrides.dark).length;

  return (
    <div className="flex flex-col gap-2">
      <Button variant="ghost" size="sm" className="w-fit" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <PaletteIcon />
        {t("colors", { mode: t(mode) })}
        {changed > 0 && <span className="rounded-full bg-primary/15 px-1.5 text-xs font-bold text-primary tabular-nums">{changed}</span>}
      </Button>
      {open && (
        <div className="flex flex-col gap-2 rounded-md border p-2">
          {(Object.keys(roles) as Role[]).map((role) => {
            const value = overrides[mode][role] ?? computed[role] ?? "";
            return (
              <label key={role} className="flex items-center gap-2 text-xs">
                <span className="w-20 shrink-0 font-semibold">{t(`color_${role}`)}</span>
                <input
                  type="color"
                  value={toHex(value)}
                  onChange={(e) => set(role, e.target.value)}
                  aria-label={t(`color_${role}`)}
                  className="size-7 shrink-0 cursor-pointer rounded border bg-transparent p-0"
                />
                <input
                  value={value}
                  onChange={(e) => set(role, e.target.value)}
                  dir="ltr"
                  spellCheck={false}
                  aria-label={`${t(`color_${role}`)} CSS`}
                  className={`h-7 min-w-0 flex-1 rounded border bg-transparent px-1.5 font-mono text-[11px] ${overrides[mode][role] ? "border-primary" : ""}`}
                />
              </label>
            );
          })}
          <div className="flex flex-wrap gap-1 pt-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={changed === 0}
              onClick={() => {
                void navigator.clipboard?.writeText(toCss(overrides, { light: ":root", dark: ".dark" }));
                toast.success(t("colorsCopied"));
              }}
            >
              <CopyIcon />
              {t("copyCss")}
            </Button>
            <Button variant="ghost" size="sm" disabled={Object.keys(overrides[mode]).length === 0} onClick={() => write({ ...overrides, [mode]: {} })}>
              <RotateCcwIcon />
              {t("resetColors", { mode: t(mode) })}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
