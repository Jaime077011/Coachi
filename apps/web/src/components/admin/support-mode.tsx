"use client";

import { api, setMockRole } from "@coachi/core";
import { useQueryClient } from "@tanstack/react-query";
import { EyeIcon, LogOutIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

type Support = { coachId: string; coachName: string };

const KEY = "coachi.support";
const EVENT = "coachi:support";

function read(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/**
 * Super admin "support mode". In mock mode it switches the demo role to coach; in Step 4 this
 * becomes a server-side, logged impersonation session.
 */
export function useSupportMode() {
  const raw = useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENT, cb);
      return () => window.removeEventListener(EVENT, cb);
    },
    read,
    () => null,
  );
  const support: Support | null = raw ? (JSON.parse(raw) as Support) : null;
  const router = useRouter();
  const queryClient = useQueryClient();

  const set = (value: Support | null) => {
    try {
      if (value) sessionStorage.setItem(KEY, JSON.stringify(value));
      else sessionStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(EVENT));
  };

  return {
    support,
    start: async (coachId: string, coachName: string) => {
      await api.admin.startSupport(coachId);
      set({ coachId, coachName });
      setMockRole("coach");
      queryClient.clear();
      router.push("/coach/today");
    },
    exit: async () => {
      if (support) await api.admin.endSupport(support.coachId);
      set(null);
      setMockRole("super_admin");
      queryClient.clear();
      router.push("/admin/coaches");
    },
  };
}

/** A red bar on every screen while in support mode. You can never miss it. */
export function SupportBar() {
  const t = useTranslations("admin.supportBar");
  const { support, exit } = useSupportMode();
  if (!support) return null;
  return (
    <div role="status" className="sticky top-0 z-50 flex items-center gap-3 bg-destructive px-4 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))] text-sm font-semibold text-white">
      <EyeIcon className="size-4 shrink-0" aria-hidden />
      <span className="flex-1">{t("viewing", { name: support.coachName })}</span>
      <Button size="sm" variant="secondary" onClick={() => void exit()}>
        <LogOutIcon data-icon="inline-start" className="rtl:rotate-180" />
        {t("exit")}
      </Button>
    </div>
  );
}
