"use client";

import { api } from "@coachi/core";
import { helperRole, type HelperRole, type Invite, type OrgRole, type TeamMemberView, type TeamView } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyIcon, Loader2Icon, Trash2Icon, UserPlusIcon, UsersIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { toast } from "sonner";
import { SeatsNotice } from "@/components/coach/seats-notice";
import { QueryState } from "@/components/coachi/query-state";
import { ScreenPanel } from "@/components/coachi/screen-panel";
import { ScreenHeader, SectionTitle } from "@/components/coachi/screen-header";
import { EmptyState } from "@/components/coachi/states";
import { StatusChip, type Tone } from "@/components/coachi/status-chip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMe } from "@/hooks/use-session";
import { Link, useRouter } from "@/i18n/navigation";
import { useFmt } from "@/lib/format";
import { initials } from "@/lib/initials";
import { qk } from "@/lib/query-keys";

export const roleTone: Record<OrgRole, Tone> = { owner: "success", head_coach: "info", coach: "neutral", assistant: "neutral" };

/** Owner only: seats, members, pending invites, and what each role can do. */
export function TeamScreen() {
  const t = useTranslations("team");
  const { orgId } = useMe();
  const router = useRouter();
  const team = useQuery({ queryKey: qk.team(orgId), queryFn: () => api.team.get(orgId), enabled: !!orgId });
  const noSeats = team.data?.seats_limit === 0;

  return (
    <div className="flex flex-col gap-6">
      <ScreenHeader
        title={t("title")}
        className="mb-0"
        action={
          !noSeats && (
            <Button asChild className="max-sm:size-12 max-sm:px-0">
              <Link href="/coach/team/invite" aria-label={t("invite")}>
                <UserPlusIcon data-icon="inline-start" />
                <span className="max-sm:sr-only">{t("invite")}</span>
              </Link>
            </Button>
          )
        }
      />
      <QueryState query={team}>{(data) => <TeamBody data={data} onInvite={() => router.push("/coach/team/invite")} />}</QueryState>
    </div>
  );
}

function TeamBody({ data, onInvite }: { data: TeamView; onInvite: () => void }) {
  const t = useTranslations("team");
  const helpers = data.members.filter((m) => m.member.role !== "owner");

  return (
    <Tabs defaultValue="members">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="members">{t("members")}</TabsTrigger>
        <TabsTrigger value="roles">{t("rolesTab")}</TabsTrigger>
      </TabsList>
      <TabsContent value="members" className="mt-4 flex flex-col gap-6">
        <Seats data={data} />

        <section>
          <SectionTitle>{t("members")}</SectionTitle>
          {helpers.length === 0 && data.invites.length === 0 ? (
            data.seats_limit === 0 ? null : (
              <EmptyState
                icon={UsersIcon}
                title={t("emptyTitle")}
                body={t("emptyBody")}
                action={
                  <Button onClick={onInvite}>
                    <UserPlusIcon data-icon="inline-start" />
                    {t("invite")}
                  </Button>
                }
              />
            )
          ) : (
            <ul className="flex flex-col gap-2">
              {data.members.map((m) => (
                <MemberRow key={m.member.id} m={m} />
              ))}
            </ul>
          )}
        </section>

        {data.invites.length > 0 && (
          <section>
            <SectionTitle>{t("pending")}</SectionTitle>
            <ul className="flex flex-col gap-2">
              {data.invites.map((i) => (
                <InviteRow key={i.id} invite={i} />
              ))}
            </ul>
          </section>
        )}
      </TabsContent>
      <TabsContent value="roles" className="mt-4">
        <RolesCard />
      </TabsContent>
    </Tabs>
  );
}

function Seats({ data }: { data: TeamView }) {
  const t = useTranslations("team");
  if (data.seats_limit === 0) return <SeatsNotice full={false} />;
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="font-semibold">{t("seats")}</span>
          <span className="tabular-nums">
            {data.seats_limit === null ? t("seatsUnlimited", { used: data.seats_used }) : t("seatsOf", { used: data.seats_used, limit: data.seats_limit })}
          </span>
        </div>
        {data.seats_limit !== null && <Progress value={(data.seats_used / data.seats_limit) * 100} aria-label={t("seats")} />}
      </CardContent>
    </Card>
  );
}

function MemberRow({ m }: { m: TeamMemberView }) {
  const t = useTranslations("team");
  const { orgId, session } = useMe();
  const queryClient = useQueryClient();
  const router = useRouter();
  const isOwner = m.member.role === "owner";
  const isMe = m.member.profile_id === session?.profile.id;

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: qk.team(orgId) });
    void queryClient.invalidateQueries({ queryKey: qk.teamMembers(orgId) });
  };
  const setRole = useMutation({
    mutationFn: (role: HelperRole) => api.team.setRole(m.member.id, role),
    onSuccess: () => {
      toast.success(t("roleChanged"));
      refresh();
    },
  });

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
      <Avatar className="size-11">
        {m.avatar_url && <AvatarImage src={m.avatar_url} alt="" />}
        <AvatarFallback className="bg-secondary text-sm font-bold">{initials(m.name)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate font-semibold">
          <bdi>{m.name}</bdi>
          {isMe && <span className="text-sm font-normal text-muted-foreground"> · {t("you")}</span>}
        </p>
        <p className="text-xs text-muted-foreground">{isOwner ? t("ownerClients") : t("clientsCount", { count: m.client_count })}</p>
      </div>
      {isOwner ? (
        <StatusChip tone={roleTone.owner}>{t("role_owner")}</StatusChip>
      ) : (
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Select value={m.member.role} onValueChange={(v) => setRole.mutate(v as HelperRole)} disabled={setRole.isPending}>
            <SelectTrigger className="h-10 flex-1 sm:w-40 sm:flex-none" aria-label={t("changeRole", { name: m.name })}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {helperRole.options.map((r) => (
                <SelectItem key={r} value={r}>
                  {t(`role_${r}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label={t("remove", { name: m.name })} onClick={() => router.push(`/coach/team/${m.member.id}/remove`)}>
            <Trash2Icon />
          </Button>
        </div>
      )}
    </li>
  );
}

function InviteRow({ invite }: { invite: Invite }) {
  const t = useTranslations("team");
  const fmt = useFmt();
  const { orgId } = useMe();
  const queryClient = useQueryClient();
  const cancel = useMutation({
    mutationFn: () => api.team.cancelInvite(invite.id),
    onSuccess: () => {
      toast.success(t("cancelled"));
      void queryClient.invalidateQueries({ queryKey: qk.team(orgId) });
    },
  });
  const url = `${globalThis.location?.origin ?? ""}/join/${invite.code}`;

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed p-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate font-semibold">
          <bdi>{invite.name}</bdi>
          {invite.member_role && <span className="text-sm font-normal text-muted-foreground"> · {t(`role_${invite.member_role}`)}</span>}
        </p>
        <p className="text-xs text-muted-foreground">{t("expires", { date: fmt.date(invite.expires_at) })}</p>
      </div>
      <div className="flex gap-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            void navigator.clipboard?.writeText(url);
            toast.success(t("copied"));
          }}
        >
          <CopyIcon data-icon="inline-start" />
          {t("copyLink")}
        </Button>
        <Button variant="ghost" size="sm" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
          <XIcon data-icon="inline-start" />
          {t("cancelInvite")}
        </Button>
      </div>
    </li>
  );
}

/** Plain words for each role. The rules themselves live in teamPermissions (packages/validation). */
function RolesCard() {
  const t = useTranslations("team");
  return (
    <div className="flex flex-col gap-2 lg:sticky lg:top-4">
      <SectionTitle className="mb-0">{t("rolesTitle")}</SectionTitle>
      <ul className="divide-y rounded-lg border bg-card text-sm">
        {(["owner", ...helperRole.options] as const).map((r) => (
          <li key={r} className="flex flex-col gap-1 p-3">
            <span className="font-semibold">{t(`role_${r}`)}</span>
            <span className="text-muted-foreground">{t(`roleDesc_${r}`)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** /coach/team/<memberId>/remove: removing never deletes anything, but it asks first. */
export function RemoveMember({ memberId }: { memberId: string }) {
  const t = useTranslations("team");
  const { orgId } = useMe();
  const router = useRouter();
  const queryClient = useQueryClient();
  const team = useQuery({ queryKey: qk.team(orgId), queryFn: () => api.team.get(orgId), enabled: !!orgId });
  const m = team.data?.members.find((x) => x.member.id === memberId);
  const remove = useMutation({
    mutationFn: () => api.team.remove(memberId),
    onSuccess: () => {
      toast.success(t("removed", { name: m?.name ?? "" }));
      void queryClient.invalidateQueries({ queryKey: qk.team(orgId) });
      void queryClient.invalidateQueries({ queryKey: qk.teamMembers(orgId) });
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
      router.push("/coach/team");
    },
  });
  return (
    <ScreenPanel
      back="/coach/team"
      title={t("removeTitle", { name: m?.name ?? "" })}
      description={t("removeBody")}
      footer={
        <>
          <Button asChild variant="secondary">
            <Link href="/coach/team">{t("keep")}</Link>
          </Button>
          <Button variant="destructive" disabled={remove.isPending || !m} onClick={() => remove.mutate()}>
            {remove.isPending && <Loader2Icon className="animate-spin" />}
            {t("removeConfirm")}
          </Button>
        </>
      }
    />
  );
}
