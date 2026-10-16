"use client";

import { api } from "@coachi/core";
import type { ClientFile } from "@coachi/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardPlusIcon, MailWarningIcon, MessageCircleIcon, UserRoundCogIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { use } from "react";
import { toast } from "sonner";
import { QueryState } from "@/components/coachi/query-state";
import { BackLink } from "@/components/coachi/screen-header";
import { StatusChip, type Tone } from "@/components/coachi/status-chip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCan } from "@/hooks/use-can";
import { useMe } from "@/hooks/use-session";
import { usePathname, useRouter } from "@/i18n/navigation";
import { initials } from "@/lib/initials";
import { qk } from "@/lib/query-keys";
import { whatsappUrl } from "@/lib/whatsapp";
import { CheckinsTab } from "./tabs/checkins-tab";
import { FileTab } from "./tabs/file-tab";
import { NotesTab } from "./tabs/notes-tab";
import { OverviewTab } from "./tabs/overview-tab";
import { PlansTab } from "./tabs/plans-tab";
import { ProgressTab } from "./tabs/progress-tab";

const tabs = ["overview", "file", "notes", "plans", "progress", "checkins"] as const;
type Tab = (typeof tabs)[number];

const statusTone: Record<ClientFile["client"]["status"], Tone> = { invited: "info", active: "success", paused: "neutral", archived: "neutral" };

export function ClientFileScreen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const file = useQuery({ queryKey: qk.clientFile(id), queryFn: () => api.clients.get(id) });
  return <QueryState query={file}>{(data) => <ClientFileView clientId={id} data={data} />}</QueryState>;
}

function ClientFileView({ clientId, data }: { clientId: string; data: ClientFile }) {
  const t = useTranslations("clientFile");
  const tClients = useTranslations("clients");
  const tParts = useTranslations("parts");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const requested = search.get("tab") as Tab | null;
  const tab: Tab = requested && tabs.includes(requested) ? requested : "overview";
  const assignHref = `/coach/clients/${clientId}/assign`;
  const can = useCan();
  const resend = useMutation({
    mutationFn: async () => {
      await new Promise((r) => setTimeout(r, 300));
    },
    onSuccess: () => toast.success(t("resent")),
  });

  const intakePending = !data.details?.intake_completed_at;

  return (
    <div className="flex flex-col gap-5">
      <BackLink href="/coach/clients" label={tCommon("back")} />
      <header className="flex flex-wrap items-center gap-4">
        <Avatar className="size-16">
          {data.profile.avatar_url && <AvatarImage src={data.profile.avatar_url} alt="" />}
          <AvatarFallback className="bg-secondary text-xl font-bold">{initials(data.profile.name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="truncate text-2xl font-bold">
            <bdi>{data.profile.name}</bdi>
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {data.client.goal && <span>{tParts(`goalName.${data.client.goal}`)}</span>}
            <StatusChip tone={statusTone[data.client.status]}>{tClients(`status_${data.client.status}`)}</StatusChip>
          </div>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          {data.profile.phone && (
            <Button asChild variant="secondary" className="flex-1 sm:flex-none">
              <a href={whatsappUrl(data.profile.phone)} target="_blank" rel="noreferrer">
                <MessageCircleIcon data-icon="inline-start" />
                {t("whatsapp")}
              </a>
            </Button>
          )}
          {can("plans_edit") && (
            <Button className="flex-1 sm:flex-none" onClick={() => router.push(assignHref)}>
              <ClipboardPlusIcon data-icon="inline-start" />
              {t("assignPlan")}
            </Button>
          )}
        </div>
      </header>

      <AssignedTo clientId={clientId} memberId={data.assigned_member_id} editable={can("clients_assign")} />

      {intakePending && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-info/40 bg-info/12 p-3">
          <MailWarningIcon className="size-5 text-info" aria-hidden />
          <span className="flex-1 text-sm font-semibold text-info">{t("waitingIntake")}</span>
          <Button variant="secondary" size="sm" disabled={resend.isPending} onClick={() => resend.mutate()}>
            {t("resend")}
          </Button>
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => router.replace(`${pathname}?tab=${v}`, { scroll: false })}>
        {/* Tabs scroll sideways on phone. */}
        <ScrollArea className="-mx-4 w-auto lg:mx-0">
          <TabsList className="mx-4 mb-1 min-w-[calc(100%-2rem)] lg:mx-0 lg:w-full lg:min-w-0">
            {tabs.map((key) => (
              <TabsTrigger key={key} value={key} className="px-3">
                {t(`tab_${key}`)}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <TabsContent value="overview" className="mt-4">
          <OverviewTab clientId={clientId} data={data} />
        </TabsContent>
        <TabsContent value="file" className="mt-4">
          <FileTab clientId={clientId} data={data} />
        </TabsContent>
        <TabsContent value="notes" className="mt-4">
          <NotesTab clientId={clientId} notes={data.notes} />
        </TabsContent>
        <TabsContent value="plans" className="mt-4">
          <PlansTab clientId={clientId} onAssign={() => router.push(assignHref)} />
        </TabsContent>
        <TabsContent value="progress" className="mt-4">
          <ProgressTab clientId={clientId} />
        </TabsContent>
        <TabsContent value="checkins" className="mt-4">
          <CheckinsTab clientId={clientId} />
        </TabsContent>
      </Tabs>

    </div>
  );
}

/** Which team member works with this client. Owners and head coaches can change it. */
function AssignedTo({ clientId, memberId, editable }: { clientId: string; memberId: string | null; editable: boolean }) {
  const t = useTranslations("team");
  const { orgId } = useMe();
  const queryClient = useQueryClient();
  const members = useQuery({ queryKey: qk.teamMembers(orgId), queryFn: () => api.team.members(orgId), enabled: !!orgId });
  const helpers = members.data?.filter((m) => m.role !== "owner") ?? [];
  const assign = useMutation({
    mutationFn: (next: string | null) => api.team.assign(clientId, next),
    onSuccess: (_, next) => {
      const name = helpers.find((m) => m.member_id === next)?.name;
      toast.success(name ? t("assignedToast", { name }) : t("unassignedToast"));
      void queryClient.invalidateQueries({ queryKey: qk.clientFile(clientId) });
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
      void queryClient.invalidateQueries({ queryKey: qk.team(orgId) });
    },
  });

  // A solo coach has no team: nothing to show.
  if (helpers.length === 0) return null;
  const current = helpers.find((m) => m.member_id === memberId);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm">
      <UserRoundCogIcon className="size-5 text-muted-foreground" aria-hidden />
      <span className="font-semibold" id="assigned-label">
        {t("assignedTo")}
      </span>
      {editable ? (
        <Select value={memberId ?? "none"} onValueChange={(v) => assign.mutate(v === "none" ? null : v)} disabled={assign.isPending}>
          <SelectTrigger className="h-10 min-w-48 flex-1 sm:flex-none" aria-labelledby="assigned-label">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("unassigned")}</SelectItem>
            {helpers.map((m) => (
              <SelectItem key={m.member_id} value={m.member_id}>
                {m.name} · {t(`role_${m.role}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span>{current ? <bdi>{current.name}</bdi> : t("unassigned")}</span>
      )}
    </div>
  );
}
