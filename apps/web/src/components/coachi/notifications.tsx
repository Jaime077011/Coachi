"use client";

import { api } from "@coachi/core";
import type { Notification } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellIcon, CheckCheckIcon, ClipboardCheckIcon, DumbbellIcon, InboxIcon, MessageSquareReplyIcon, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { QueryState } from "@/components/coachi/query-state";
import { EmptyState } from "@/components/coachi/states";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-session";
import { Link, useRouter } from "@/i18n/navigation";
import { useFmt } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

const icons: Record<Notification["type"], LucideIcon> = {
  request_new: InboxIcon,
  checkin_new: ClipboardCheckIcon,
  workout_done: DumbbellIcon,
  request_answered: InboxIcon,
  plan_assigned: DumbbellIcon,
  checkin_reply: MessageSquareReplyIcon,
};

function useNotifications() {
  const { session } = useMe();
  return useQuery({
    queryKey: qk.notifications,
    queryFn: () => api.notifications.list(),
    enabled: !!session,
    // Until push arrives (Step 4), check now and then while the app is open.
    refetchInterval: 60_000,
  });
}

/** Bell with the unread count, for the Today headers. */
export function NotificationBell() {
  const t = useTranslations("notifications");
  const { session } = useMe();
  const list = useNotifications();
  const unread = list.data?.filter((n) => !n.read_at).length ?? 0;
  const href = session?.profile.role === "client" ? "/app/notifications" : "/coach/notifications";
  return (
    <Button asChild variant="ghost" size="icon" className="relative size-11 shrink-0">
      <Link href={href} aria-label={unread ? t("bellUnread", { count: unread }) : t("title")}>
        <BellIcon className="size-6" aria-hidden />
        {unread > 0 && (
          <span className="absolute end-1.5 top-1.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] leading-5 font-bold text-primary-foreground tabular-nums">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    </Button>
  );
}

/** The list: newest first, unread marked, tap to open what it's about. */
export function NotificationsList() {
  const t = useTranslations("notifications");
  const fmt = useFmt();
  const router = useRouter();
  const queryClient = useQueryClient();
  const list = useNotifications();

  const refresh = () => void queryClient.invalidateQueries({ queryKey: qk.notifications });
  const markAll = useMutation({ mutationFn: () => api.notifications.markAllRead(), onSuccess: refresh });
  const open = useMutation({
    mutationFn: (n: Notification) => (n.read_at ? Promise.resolve() : api.notifications.markRead(n.id)),
    onSettled: (_r, _e, n) => {
      refresh();
      if (n.link) router.push(n.link);
    },
  });

  const text = (n: Notification, part: "title" | "body") =>
    t(`${n.type}_${part}` as Parameters<typeof t>[0], { name: "", coach: "", plan: "", workout: "", accepted: "yes", ...n.params });

  return (
    <QueryState
      query={list}
      isEmpty={(items) => items.length === 0}
      empty={<EmptyState icon={BellIcon} title={t("empty")} body={t("emptyBody")} />}
    >
      {(items) => (
        <div className="flex flex-col gap-3">
          {items.some((n) => !n.read_at) && (
            <Button variant="ghost" size="sm" className="self-end" disabled={markAll.isPending} onClick={() => markAll.mutate()}>
              <CheckCheckIcon data-icon="inline-start" />
              {t("markAll")}
            </Button>
          )}
          <ul className="divide-y rounded-lg border bg-card">
            {items.map((n) => {
              const Icon = icons[n.type];
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => open.mutate(n)}
                    className={cn(
                      "flex min-h-16 w-full items-start gap-3 p-3 text-start transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      !n.read_at && "bg-primary/5",
                    )}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className={cn("text-[15px]", !n.read_at && "font-semibold")}>{text(n, "title")}</span>
                      <span className="text-sm text-muted-foreground">{text(n, "body")}</span>
                      <span className="text-xs text-hint">{fmt.relative(n.created_at)}</span>
                    </span>
                    {!n.read_at && (
                      <span className="mt-2 size-2.5 shrink-0 rounded-full bg-primary">
                        <span className="sr-only">{t("unread")}</span>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </QueryState>
  );
}
