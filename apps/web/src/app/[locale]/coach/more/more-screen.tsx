"use client";

import { ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ScreenHeader } from "@/components/coachi/screen-header";
import { coachMore } from "@/components/shell/nav-config";
import { useCan } from "@/hooks/use-can";
import { Link } from "@/i18n/navigation";

/** Phone: the coach's 5th tab. The rest of the menu as a list. */
export function MoreScreen() {
  const t = useTranslations("nav");
  const tShell = useTranslations("shell");
  const can = useCan();
  const items = coachMore.filter((item) => !item.permission || can(item.permission));
  return (
    <div className="flex flex-col">
      <ScreenHeader title={tShell("more")} />
      <ul className="flex flex-col divide-y rounded-lg border bg-card">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="flex min-h-14 items-center gap-3 px-4 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              <item.icon className="size-5 text-muted-foreground" aria-hidden />
              <span className="flex-1 font-semibold">{t(item.label)}</span>
              <ChevronRightIcon className="size-5 text-hint rtl:rotate-180" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
