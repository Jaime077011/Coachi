import type { Messages } from "@coachi/i18n";
import type { TeamPermission } from "@coachi/validation";
import {
  BookUserIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  CreditCardIcon,
  HouseIcon,
  IdCardIcon,
  InboxIcon,
  LayersIcon,
  LayoutDashboardIcon,
  LibraryBigIcon,
  ListChecksIcon,
  ScrollTextIcon,
  SettingsIcon,
  TrophyIcon,
  UserRoundIcon,
  UsersRoundIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

type Nav = Messages["nav"];
export type NavKey = { [R in keyof Nav]: `${R & string}.${keyof Nav[R] & string}` }[keyof Nav];

/** `permission`: coach team roles without it don't see the item. */
export type NavItem = { href: string; label: NavKey; icon: LucideIcon; permission?: TeamPermission };

/** Client: 4 tabs. Meals and check-in open from Today, so the bar stays short. */
export const clientTabs: NavItem[] = [
  { href: "/app/today", label: "client.today", icon: HouseIcon },
  { href: "/app/plan", label: "client.plan", icon: CalendarDaysIcon },
  { href: "/app/journey", label: "client.journey", icon: TrophyIcon },
  { href: "/app/me", label: "client.me", icon: UserRoundIcon },
];

/** Coach phone tab bar; the 5th tab ("More") opens coachMore. */
export const coachTabs: NavItem[] = [
  { href: "/coach/today", label: "coach.today", icon: HouseIcon },
  { href: "/coach/clients", label: "coach.clients", icon: UsersRoundIcon },
  { href: "/coach/plans", label: "coach.plans", icon: ClipboardListIcon, permission: "plans_edit" },
  { href: "/coach/requests", label: "coach.requests", icon: InboxIcon, permission: "requests" },
];

export const coachMore: NavItem[] = [
  { href: "/coach/library", label: "coach.library", icon: LibraryBigIcon },
  { href: "/coach/check-in-form", label: "coach.checkInForm", icon: ListChecksIcon, permission: "checkin_form" },
  { href: "/coach/profile", label: "coach.profile", icon: IdCardIcon, permission: "profile" },
  { href: "/coach/team", label: "coach.team", icon: UsersIcon, permission: "team" },
  { href: "/coach/subscription", label: "coach.subscription", icon: CreditCardIcon, permission: "subscription" },
  { href: "/coach/settings", label: "coach.settings", icon: SettingsIcon },
];

export const adminNav: NavItem[] = [
  { href: "/admin/overview", label: "admin.overview", icon: LayoutDashboardIcon },
  { href: "/admin/coaches", label: "admin.coaches", icon: UsersRoundIcon },
  { href: "/admin/plans", label: "admin.plans", icon: LayersIcon },
  { href: "/admin/directory", label: "admin.directory", icon: BookUserIcon },
  { href: "/admin/libraries", label: "admin.libraries", icon: LibraryBigIcon },
  { href: "/admin/audit", label: "admin.audit", icon: ScrollTextIcon },
  { href: "/admin/settings", label: "admin.settings", icon: SettingsIcon },
];

/** Navigation sets by key, so server layouts can pick one without passing icon functions to the client. */
export const navSets = {
  client: { tabs: clientTabs, more: undefined, sidebar: [] },
  coach: { tabs: coachTabs, more: coachMore, sidebar: [coachTabs, coachMore] },
  admin: { tabs: [], more: undefined, sidebar: [adminNav] },
} satisfies Record<string, { tabs: NavItem[]; more: NavItem[] | undefined; sidebar: NavItem[][] }>;
export type NavSet = keyof typeof navSets;

export const isActive = (pathname: string | null, href: string) =>
  pathname !== null && (pathname === href || pathname.startsWith(`${href}/`));
