"use client";

import {
  getMockDataState,
  resetMockDatabase,
  getMockRole,
  setMockDataState,
  setMockRole,
  type MockDataState,
  type MockRole,
} from "@coachi/core";
import type { Locale } from "@coachi/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { FlaskConicalIcon, LayoutGridIcon, RotateCcwIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { roleHome } from "@/lib/roles";

/** Mock mode only: switch role, language, theme, and data state to test every screen fast. */
export function DevSwitcher() {
  const t = useTranslations("dev");
  const tRoles = useTranslations("roles");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { resolvedTheme, setTheme } = useTheme();

  // Stored in localStorage, so unknown on the server (null) until the client renders.
  const role = useSyncExternalStore(subscribe, getMockRole, () => null);
  const dataState = useSyncExternalStore(subscribe, getMockDataState, () => null);

  const changeRole = (next: MockRole) => {
    setMockRole(next);
    notify();
    queryClient.clear();
    router.push(roleHome[next]);
  };

  const changeData = (next: MockDataState) => {
    setMockDataState(next);
    notify();
    void queryClient.resetQueries();
  };

  const changeLocale = (next: Locale) => router.replace(pathname, { locale: next });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className="fixed end-3 bottom-[calc(80px+env(safe-area-inset-bottom))] z-50 gap-1.5 rounded-full border shadow-md md:bottom-4"
          aria-label={t("switcher")}
        >
          <FlaskConicalIcon />
          {dataState && dataState !== "normal" ? t(dataState) : null}
          <span className="sr-only md:not-sr-only">{t("switcher")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-80 gap-4 p-4">
        <Row label={t("role")}>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={role ?? ""}
            onValueChange={(v) => v && changeRole(v as MockRole)}
          >
            <ToggleGroupItem value="client">{tRoles("client")}</ToggleGroupItem>
            <ToggleGroupItem value="coach">{tRoles("coach")}</ToggleGroupItem>
            <ToggleGroupItem value="super_admin">{tRoles("admin")}</ToggleGroupItem>
          </ToggleGroup>
        </Row>
        <Row label={t("language")}>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={locale}
            onValueChange={(v) => v && changeLocale(v as Locale)}
          >
            <ToggleGroupItem value="ar" lang="ar">
              عربي
            </ToggleGroupItem>
            <ToggleGroupItem value="en" lang="en">
              English
            </ToggleGroupItem>
          </ToggleGroup>
        </Row>
        <Row label={t("theme")}>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={resolvedTheme ?? ""}
            onValueChange={(v) => v && setTheme(v)}
          >
            <ToggleGroupItem value="dark">{t("dark")}</ToggleGroupItem>
            <ToggleGroupItem value="light">{t("light")}</ToggleGroupItem>
          </ToggleGroup>
        </Row>
        <Row label={t("dataState")}>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={dataState ?? ""}
            onValueChange={(v) => v && changeData(v as MockDataState)}
          >
            {(["normal", "empty", "error", "slow"] as const).map((s) => (
              <ToggleGroupItem key={s} value={s}>
                {t(s)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Row>
        <div className="flex flex-wrap gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dev/kit">
              <LayoutGridIcon />
              {t("kit")}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              resetMockDatabase();
              window.location.reload();
            }}
          >
            <RotateCcwIcon />
            {t("reset")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const EVENT = "coachi:dev-switch";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

const notify = () => window.dispatchEvent(new Event(EVENT));

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
