"use client";

import { BellIcon, ChevronLeftIcon, LogOutIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Suspense } from "react";
import { localeDirection } from "@coachi/i18n";
import { Logo, Mark } from "@/components/brand/logo";
import { DemoBadge } from "@/components/brand/demo-badge";
import { useUnreadCount } from "@/components/coachi/notifications";
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
import { cn } from "@/lib/utils";
import { useSignOut } from "./account-settings";
import { isActive, navSets, type NavSet } from "./nav-config";

/**
 * Desktop side menu: a floating glass panel, on the right in Arabic. Folds to icons
 * (the arrow on its edge, the rail, or Ctrl/Cmd + B) and remembers that in a cookie.
 * Active item: soft primary wash. Footer: Notifications next to Log out.
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
  const unread = useUnreadCount();
  const collapsed = state === "collapsed";

  return (
    <Sidebar
      side={side}
      variant="floating"
      edge={<CollapseTab collapsed={collapsed} onToggle={toggleSidebar} label={collapsed ? tShell("expand") : tShell("collapse")} />}
      collapsible="icon"
      // Attached to the screen edge (left in English, right in Arabic): no gap and square corners on
      // that side, rounded corners toward the page. Logical start/end mirror it in Arabic.
      className="ps-0! [&>[data-slot=sidebar-inner]]:rounded-s-none [&>[data-slot=sidebar-inner]]:rounded-e-2xl [&>[data-slot=sidebar-inner]]:border [&>[data-slot=sidebar-inner]]:border-s-0 [&>[data-slot=sidebar-inner]]:border-sidebar-border [&>[data-slot=sidebar-inner]]:shadow-card [&>[data-slot=sidebar-inner]]:ring-0 [&>[data-slot=sidebar-inner]]:backdrop-blur-2xl [&>[data-slot=sidebar-inner]]:backdrop-saturate-150"
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
                        className="relative h-11 rounded-xl transition-all duration-200 hover:bg-foreground/5 data-active:bg-linear-to-r data-active:from-primary/18 data-active:to-primary/4 data-active:font-semibold data-active:text-foreground rtl:data-active:bg-linear-to-l data-active:[&_svg]:text-primary group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:hidden"
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
      <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:px-2">
        <SidebarMenu className="flex-row gap-1 group-data-[collapsible=icon]:flex-col">
          {nav === "coach" && (
            <SidebarMenuItem className="min-w-0 flex-1">
              <SidebarMenuButton
                asChild
                isActive={isActive(pathname, "/coach/notifications")}
                tooltip={{ children: tShell("notifications"), side: tipSide }}
                className="relative h-10 overflow-visible rounded-xl text-muted-foreground hover:bg-foreground/5 hover:text-foreground data-active:bg-primary/12 data-active:text-foreground group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:hidden"
              >
                <Link href="/coach/notifications" aria-label={unread ? tShell("notificationsUnread", { count: unread }) : tShell("notifications")}>
                  <BellIcon aria-hidden className="size-5!" />
                  <span className="flex-1 truncate">{tShell("notifications")}</span>
                  {unread > 0 && (
                    <span
                      aria-hidden
                      className="grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] leading-5 font-bold text-primary-foreground tabular-nums group-data-[collapsible=icon]:absolute! group-data-[collapsible=icon]:-end-1 group-data-[collapsible=icon]:-top-1 group-data-[collapsible=icon]:grid! group-data-[collapsible=icon]:ring-2 group-data-[collapsible=icon]:ring-sidebar-accent"
                    >
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem className={cn(nav !== "coach" && "flex-1")}>
            <SidebarMenuButton
              onClick={signOut}
              aria-label={tShell("signOut")}
              tooltip={{ children: tShell("signOut"), side: tipSide }}
              className={cn(
                "h-10 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:hidden",
                // Next to Notifications it's just the icon; alone (admin) it keeps its label.
                nav === "coach" && "w-10 justify-center [&>span]:hidden",
              )}
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

const TAB_OUTLINE = "M0 0C0 5.52 4.48 10 10 10H12Q22 10 22 20V56Q22 66 12 66H10C4.48 66 0 70.48 0 76";

/**
 * Fold / unfold: a tab growing out of the menu's inner edge, halfway down (mirrored in Arabic).
 * It sits beside the panel, not inside it, so it can use the same glass as the menu (a blur
 * inside the panel would only see the panel). The glass is cut to the tab's shape: concave
 * curves where it joins, so the menu's border flows into its outline like a browser tab. It
 * covers the menu's edge line where they meet. The joining edge (x = 0) has no stroke.
 */
function CollapseTab({ collapsed, onToggle, label }: { collapsed: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-expanded={!collapsed}
      title={label}
      // end-2 = the panel's edge (the container's end padding); 1px back over the panel's border line.
      className="absolute end-2 top-1/2 z-30 grid h-14 w-[22px] -translate-y-1/2 place-items-center rounded-e-xl text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ltr:translate-x-[calc(100%-1px)] rtl:-translate-x-[calc(100%-1px)]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute start-0 -top-2.5 h-[76px] w-[23px] bg-sidebar backdrop-blur-2xl backdrop-saturate-150 rtl:-scale-x-100"
        style={{ clipPath: `path("${TAB_OUTLINE}Z")` }}
      />
      <svg aria-hidden width="23" height="76" viewBox="0 0 23 76" className="pointer-events-none absolute start-0 -top-2.5 overflow-visible rtl:-scale-x-100">
        <path d={TAB_OUTLINE} fill="none" stroke="var(--sidebar-border)" strokeWidth="1" />
      </svg>
      {/* Points the way the menu will move: in when open, out when folded. */}
      <ChevronLeftIcon
        aria-hidden
        strokeWidth={2.5}
        className={cn("relative size-[18px] transition-transform duration-200 rtl:-scale-x-100", collapsed && "rotate-180")}
      />
    </button>
  );
}
