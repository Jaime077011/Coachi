import { useLocale, useTranslations } from "next-intl";

/** Western digits (1, 2, 3) in both languages, whatever the browser's default for Arabic. */
const latn = (locale: string) => `${locale}-u-nu-latn`;

const DAY = 86_400_000;

const startOfDay = (d: Date) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/** One place for every number, weight, price, and date on screen. */
export function useFmt() {
  const locale = useLocale();
  const tUnits = useTranslations("units");
  const tDates = useTranslations("dates");
  const loc = latn(locale);

  const num = (value: number, maxFraction = 1) =>
    new Intl.NumberFormat(loc, { maximumFractionDigits: maxFraction }).format(value);

  const date = (iso: string, style: "short" | "medium" | "long" = "medium") => {
    const options: Intl.DateTimeFormatOptions =
      style === "short" ? { day: "numeric", month: "short" } : style === "medium" ? { day: "numeric", month: "short", year: "numeric" } : { weekday: "long", day: "numeric", month: "long" };
    return new Intl.DateTimeFormat(loc, options).format(new Date(iso.length === 10 ? `${iso}T12:00:00` : iso));
  };

  return {
    num,
    kg: (value: number) => tUnits("kg", { value: num(value) }),
    cm: (value: number) => tUnits("cm", { value: num(value) }),
    kcal: (value: number) => tUnits("kcal", { value: num(value, 0) }),
    grams: (value: number) => tUnits("g", { value: num(value, 0) }),
    minutes: (value: number) => tUnits("min", { value: num(value, 0) }),
    /** Money is stored as whole piasters. */
    egp: (piasters: number) => tUnits("egp", { value: num(piasters / 100, 0) }),
    date,
    time: (iso: string) => new Intl.DateTimeFormat(loc, { hour: "numeric", minute: "2-digit" }).format(new Date(iso)),
    weekday: (iso: string, width: "short" | "narrow" = "short") =>
      new Intl.DateTimeFormat(loc, { weekday: width }).format(new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)),
    /** "Today", "Yesterday", "In 3 days" when close; the full date when far. */
    relative: (iso: string) => {
      const target = startOfDay(new Date(iso.length === 10 ? `${iso}T12:00:00` : iso));
      const days = Math.round((target.getTime() - startOfDay(new Date()).getTime()) / DAY);
      if (days === 0) return tDates("today");
      if (days === -1) return tDates("yesterday");
      if (days === 1) return tDates("tomorrow");
      if (Math.abs(days) <= 6) return new Intl.RelativeTimeFormat(loc, { numeric: "auto" }).format(days, "day");
      return date(iso, "short");
    },
    /** 75 → "1:15" */
    clock: (seconds: number) => {
      const s = Math.max(0, Math.round(seconds));
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    },
  };
}

export type Fmt = ReturnType<typeof useFmt>;

/** Exercise and food names are stored in both languages. */
export function useLocalName() {
  const locale = useLocale();
  return (item: { name_ar: string; name_en: string }) => (locale === "ar" ? item.name_ar : item.name_en);
}
