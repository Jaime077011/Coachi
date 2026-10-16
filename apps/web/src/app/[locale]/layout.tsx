import "../globals.css";
import { isLocale, localeDirection, locales } from "@coachi/i18n";
import { dataSource } from "@coachi/core";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { locale as rootLocale } from "next/root-params";
import { DevSwitcher } from "@/components/dev/dev-switcher";
import { Providers } from "@/components/providers";
import { fontVariables } from "../fonts";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  const locale = await rootLocale();
  return {
    title: { default: t("appName"), template: `%s · ${t("appName")}` },
    description: t("tagline"),
    applicationName: "Coachi",
    manifest: `/${locale}/manifest.webmanifest`,
    icons: {
      icon: "/brand/coachi-mark-dark-32-favicon.svg",
      // iPhone ignores SVG here: it needs a PNG.
      apple: { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
    },
    appleWebApp: { capable: true, title: t("appName"), statusBarStyle: "black-translucent" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#040814" },
    { media: "(prefers-color-scheme: light)", color: "#F4EFE6" },
  ],
};

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await rootLocale();
  if (!isLocale(locale)) notFound();
  const dir = localeDirection[locale];

  return (
    <html lang={locale} dir={dir} className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Folded side menu: mark it before the first paint so it never opens then folds (see SidebarProvider). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(/(?:^|; )sidebar_state=false/.test(document.cookie))document.documentElement.setAttribute("data-sidebar-folded","")}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <Providers dir={dir}>
            {children}
            {dataSource === "mock" && (
              <Suspense fallback={null}>
                <DevSwitcher />
              </Suspense>
            )}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
