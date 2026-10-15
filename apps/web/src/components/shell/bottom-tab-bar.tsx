"use client";

import { EllipsisIcon } from "lucide-react";
import { useCan } from "@/hooks/use-can";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { isActive, navSets, type NavSet } from "./nav-config";

const tabClass =
  "flex min-h-11 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-ring";

/** Phone tab bar: 64 px, surface fill, active tab in primary. Max 5 items. */
type Props = { nav: NavSet; className?: string };

export function BottomTabBar(props: Props) {
  // The pathname is runtime data on dynamic routes: show the bar with no active tab until it streams in.
  return (
    <Suspense fallback={<TabBarView {...props} pathname={null} />}>
      <TabBarWithPath {...props} />
    </Suspense>
  );
}

function TabBarWithPath(props: Props) {
  return <TabBarView {...props} pathname={usePathname()} />;
}

function TabBarView({ nav, className, pathname }: Props & { pathname: string | null }) {
  // A set with `more` gets a 5th "More" tab that opens those items in a bottom sheet.
  const can = useCan();
  const allowed = (item: { permission?: Parameters<typeof can>[0] }) => !item.permission || can(item.permission);
  const items = navSets[nav].tabs.filter(allowed);
  const more = navSets[nav].more?.filter(allowed);
  const t = useTranslations("nav");
  const tShell = useTranslations("shell");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = more?.some((item) => isActive(pathname, item.href)) ?? false;
  const columns = items.length + (more ? 1 : 0);

  return (
    <nav
      aria-label={tShell("mainNav")}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      <ul className="mx-auto grid h-16 max-w-xl" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="contents">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(tabClass, active ? "text-primary" : "text-hint hover:text-foreground")}
              >
                <item.icon className="size-6" aria-hidden />
                {t(item.label)}
              </Link>
            </li>
          );
        })}
        {more && (
          <li className="contents">
            <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
              <DrawerTrigger className={cn(tabClass, moreActive ? "text-primary" : "text-hint hover:text-foreground")}>
                <EllipsisIcon className="size-6" aria-hidden />
                {tShell("more")}
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>{tShell("more")}</DrawerTitle>
                </DrawerHeader>
                <ul className="flex flex-col gap-1 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                  {more.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "flex min-h-12 items-center gap-3 rounded-md px-3 font-semibold hover:bg-accent",
                          isActive(pathname, item.href) && "bg-accent text-primary",
                        )}
                      >
                        <item.icon className="size-5" aria-hidden />
                        {t(item.label)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </DrawerContent>
            </Drawer>
          </li>
        )}
      </ul>
    </nav>
  );
}
