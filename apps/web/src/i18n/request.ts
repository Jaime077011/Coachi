import { isLocale, messages } from "@coachi/i18n";
import { getRequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  // An explicit locale (e.g. getTranslations({ locale })) wins; otherwise read the [locale] segment.
  const requested = locale ?? (await rootLocale());
  const resolved = isLocale(requested) ? requested : routing.defaultLocale;
  return {
    locale: resolved,
    messages: messages[resolved],
    timeZone: "Africa/Cairo",
  };
});
