import type { Locale, Messages } from "@coachi/i18n";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
