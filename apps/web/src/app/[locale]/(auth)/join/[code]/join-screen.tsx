"use client";

import { api } from "@coachi/core";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon, TimerOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { use } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { QueryState } from "@/components/coachi/query-state";
import { EmptyState } from "@/components/coachi/states";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { initials } from "@/lib/initials";

/** Invite landing: the coach's name and photo, then login. A new client goes to the intake form. */
export function JoinScreen({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const t = useTranslations("join");
  const router = useRouter();
  const invite = useQuery({ queryKey: ["invite", code], queryFn: () => api.auth.getInvite(code) });

  return (
    <QueryState query={invite}>
      {(data) =>
        data.expired ? (
          <EmptyState
            icon={TimerOffIcon}
            title={t("expiredTitle")}
            body={t("expiredBody")}
            action={
              <Button asChild>
                <Link href="/app/coaches">
                  <SearchIcon data-icon="inline-start" />
                  {t("findCoach")}
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <Avatar className="size-20">
                {data.coach_photo_url && <AvatarImage src={data.coach_photo_url} alt="" />}
                <AvatarFallback className="bg-secondary text-2xl font-bold">{initials(data.coach_name)}</AvatarFallback>
              </Avatar>
              <p className="text-lg font-semibold">{t("invitedBy", { coach: data.coach_name })}</p>
            </div>
            <LoginForm afterLogin={() => router.replace("/app/intake")} />
          </div>
        )
      }
    </QueryState>
  );
}
