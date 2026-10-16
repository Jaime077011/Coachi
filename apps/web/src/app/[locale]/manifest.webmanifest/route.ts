import { isLocale, localeDirection, locales } from "@coachi/i18n";
import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * One manifest per language, so the installed app opens in the language (and direction) it was
 * installed from. It starts at /start, which sends each role to its own area.
 */
export async function GET(_req: Request, ctx: RouteContext<"/[locale]/manifest.webmanifest">) {
  const { locale } = await ctx.params;
  if (!isLocale(locale)) return new Response(null, { status: 404 });
  const t = await getTranslations({ locale, namespace: "common" });
  const manifest: MetadataRoute.Manifest = {
    id: `/${locale}/start`,
    name: t("appName"),
    short_name: t("appName"),
    description: t("tagline"),
    lang: locale,
    dir: localeDirection[locale],
    start_url: `/${locale}/start`,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#040814",
    theme_color: "#040814",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return Response.json(manifest, { headers: { "Content-Type": "application/manifest+json" } });
}
