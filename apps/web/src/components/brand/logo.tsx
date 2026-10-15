import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const sizes = {
  ar: { web: [200, 73], mobile: [140, 51] },
  en: { web: [240, 89], mobile: [160, 59] },
} as const;

/**
 * The logo (name + tagline) in the page's language. Both color versions render and CSS shows
 * the one for the current theme, so there is no flash or hydration mismatch.
 * Below 120 px wide the tagline can't be read: use <Mark /> instead.
 */
export function Logo({ size = "mobile", className }: { size?: "web" | "mobile"; className?: string }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const [width, height] = sizes[locale][size];
  const alt = `${t("appName")}, ${t("tagline")}`;
  const src = (bg: "dark" | "light") => `/brand/coachi-logo-${locale}-for-${bg}-bg-${size}.svg`;

  return (
    <span className={cn("inline-flex shrink-0", className)}>
      <Image src={src("light")} alt={alt} width={width} height={height} unoptimized priority className="dark:hidden" />
      <Image src={src("dark")} alt={alt} width={width} height={height} unoptimized priority className="hidden dark:block" />
    </span>
  );
}

/** The arm mark in its tile. Never next to the name. */
export function Mark({
  size = 32,
  tile = "dark",
  className,
}: {
  size?: number;
  tile?: "dark" | "red" | "cream";
  className?: string;
}) {
  const file = size <= 32 ? "32-favicon" : size <= 192 ? "192-pwa" : "512-app";
  return (
    <Image
      src={`/brand/coachi-mark-${tile}-${file}.svg`}
      alt="Coachi"
      width={size}
      height={size}
      unoptimized
      className={cn("shrink-0", className)}
    />
  );
}
