"use client";

import { LogOutIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Suspense } from "react";
import { localeDirection } from "@coachi/i18n";
import { Logo, Mark } from "@/components/brand/logo";
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
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/navigation";
import { useSignOut } from "./account-settings";
import { isActive, navSets, type NavSet } from "./nav-config";

/**
 * Desktop side menu: a floating glass panel, on the right in Arabic. Folds to icons
 * (button, rail, or Ctrl/Cmd + B) and remembers that in a cookie.
 * Active item: soft primary wash + a glowing fire bar on the inner edge.
 */
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
  const side = localeDirection[locale] === "rtl" ? "right" : "left";
  // Tooltips open toward the page, away from the menu.
  const tipSide = side === "left" ? "right" : "left";
  const signOut = useSignOut();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar
      side={side}
      variant="floating"
      collapsible="icon"
      className="[&>[data-slot=sidebar-inner]]:rounded-2xl [&>[data-slot=sidebar-inner]]:border [&>[data-slot=sidebar-inner]]:border-sidebar-border [&>[data-slot=sidebar-inner]]:shadow-card [&>[data-slot=sidebar-inner]]:ring-0 [&>[data-slot=sidebar-inner]]:backdrop-blur-2xl [&>[data-slot=sidebar-inner]]:backdrop-saturate-150"
    >
      <SidebarHeader className="flex-row items-center justify-between gap-2 border-b border-sidebar-border p-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
        {collapsed ? (
          <Link href={navSets[nav].sidebar[0]?.[0]?.href ?? "/"} aria-label={t(navSets[nav].sidebar[0]?.[0]?.label ?? "coach.today")}>
            <Mark size={32} tile="red" className="rounded-lg" />
          </Link>
        ) : (
          <>
            <Logo size="mobile" />
            <DemoBadge />
          </>
        )}
      </SidebarHeader>
      <SidebarContent className="py-2">
        {groups.map((items, i) => (
          <SidebarGroup key={i} className="group-data-[collapsible=icon]:px-2">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        size="lg"
                        tooltip={{ children: t(item.label), side: tipSide }}
                        className="relative h-11 rounded-xl transition-all duration-200 hover:bg-foreground/5 data-active:bg-linear-to-r data-active:from-primary/18 data-active:to-primary/4 data-active:font-semibold data-active:text-foreground rtl:data-active:bg-linear-to-l data-active:[&_svg]:text-primary data-active:before:absolute data-active:before:inset-y-2.5 data-active:before:end-0 data-active:before:w-[3px] data-active:before:rounded-full data-active:before:bg-fire data-active:before:shadow-[0_0_12px_var(--glow-fire)] group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:before:hidden group-data-[collapsible=icon]:[&>span]:hidden"
                      >
                        <Link href={item.href} aria-current={active ? "page" : undefined}>
                          <item.icon aria-hidden className="size-5!" />
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
      <SidebarFooter className="gap-1 p-4 group-data-[collapsible=icon]:px-2">
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleSidebar}
              tooltip={{ children: tShell("expand"), side: tipSide }}
              aria-expanded={!collapsed}
              className="h-10 rounded-xl text-muted-foreground hover:bg-foreground/5 hover:text-foreground group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:hidden"
            >
              {collapsed ? (
                <PanelLeftOpenIcon aria-hidden className="size-5! rtl:rotate-180" />
              ) : (
                <PanelLeftCloseIcon aria-hidden className="size-5! rtl:rotate-180" />
              )}
              <span>{collapsed ? tShell("expand") : tShell("collapse")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              tooltip={{ children: tShell("signOut"), side: tipSide }}
              className="h-10 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:hidden"
            >
              <LogOutIcon aria-hidden className="size-5! rtl:rotate-180" />
              <span>{tShell("signOut")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
