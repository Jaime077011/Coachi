import type { Messages } from "@coachi/i18n";
import { ConstructionIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type ScreenKey = keyof Messages["screens"];

/** Stand-in until the real screen is built in Step 1. */
export function ScreenPlaceholder({ screen }: { screen: ScreenKey }) {
  const t = useTranslations("screens");
  const tCommon = useTranslations("common");
  return (
    <section className="flex flex-col gap-6">
      <h1 className="font-display text-3xl uppercase lg:text-4xl">{t(screen)}</h1>
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center text-muted-foreground">
        <ConstructionIcon className="size-8" aria-hidden />
        <p>{tCommon("comingSoon")}</p>
      </div>
    </section>
  );
}
