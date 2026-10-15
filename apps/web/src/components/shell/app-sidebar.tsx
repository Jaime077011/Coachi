"use client";

import { LogOutIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Suspense } from "react";
import { localeDirection } from "@coachi/i18n";
import { Logo } from "@/components/brand/logo";
import { DemoBadge } from "@/components/brand/demo-badge";
import { useCan } from "@/hooks/use-can";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/navigation";
import { useSignOut } from "./account-settings";
import { isActive, navSets, type NavSet } from "./nav-config";

/** Desktop side menu: on the right in Arabic. Active item: surface-2 fill + 3 px primary bar on the inner edge. */
export function AppSidebar({ nav }: { nav: NavSet }) {
  return (
    <Suspense fallback={<SidebarView nav={nav} pathname={null} />}>
      <SidebarWithPath nav={nav} />
    </Suspense>
  );
}

function SidebarWithPath({ nav }: { nav: NavSet }) {
  return <SidebarView nav={nav} pathname={usePathname()} />;
}

function SidebarView({ nav, pathname }: { nav: NavSet; pathname: string | null }) {
  const can = useCan();
  const groups = navSets[nav].sidebar.map((items) => items.filter((item) => !item.permission || can(item.permission)));
  const t = useTranslations("nav");
  const tShell = useTranslations("shell");
  const locale = useLocale();
  const signOut = useSignOut();

  return (
    <Sidebar side={localeDirection[locale] === "rtl" ? "right" : "left"}>
      <SidebarHeader className="flex-row items-center justify-between gap-2 p-4">
        <Logo size="mobile" />
        <DemoBadge />
      </SidebarHeader>
      <SidebarContent>
        {groups.map((items, i) => (
          <SidebarGroup key={i}>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        size="lg"
                        className="relative data-active:font-semibold data-active:before:absolute data-active:before:inset-y-2 data-active:before:end-0 data-active:before:w-[3px] data-active:before:rounded-full data-active:before:bg-primary"
                      >
                        <Link href={item.href} aria-current={active ? "page" : undefined}>
                          <item.icon aria-hidden />
                          <span>{t(item.label)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOutIcon aria-hidden className="rtl:rotate-180" />
              <span>{tShell("signOut")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
