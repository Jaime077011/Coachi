import { defaultLocale, locales } from "@coachi/i18n";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Arabic for new visitors in Egypt; the switch in Me / the dev panel changes it.
  localeDetection: false,
});
