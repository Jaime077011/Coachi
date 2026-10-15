import ar from "../messages/ar.json";
import en from "../messages/en.json";

/** Arabic first: it is the default for new visitors. */
export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";

export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
};

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (locales as readonly string[]).includes(value);

export const messages = { ar, en } as const;

/** English is the reference shape; ar.json must have the same keys. */
export type Messages = typeof en;
