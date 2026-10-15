"use client";

import { api } from "@coachi/core";
import type { ClientFile } from "@coachi/validation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ClipboardPlusIcon, MailWarningIcon, MessageCircleIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { use, useState } from "react";
import { toast } from "sonner";
import { AssignTemplateDialog } from "@/components/coach/assign-dialogs";
import { QueryState } from "@/components/coachi/query-state";
import { BackLink } from "@/components/coachi/screen-header";
import { StatusChip, type Tone } from "@/components/coachi/status-chip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [assigning, setAssigning] = useState(false);
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
          <Button className="flex-1 sm:flex-none" onClick={() => setAssigning(true)}>
            <ClipboardPlusIcon data-icon="inline-start" />
            {t("assignPlan")}
          </Button>
        </div>
      </header>

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
          <TabsList className="mx-4 mb-1 lg:mx-0">
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
          <PlansTab clientId={clientId} onAssign={() => setAssigning(true)} />
        </TabsContent>
        <TabsContent value="progress" className="mt-4">
          <ProgressTab clientId={clientId} />
        </TabsContent>
        <TabsContent value="checkins" className="mt-4">
          <CheckinsTab clientId={clientId} />
        </TabsContent>
      </Tabs>

      <AssignTemplateDialog clientId={clientId} open={assigning} onOpenChange={setAssigning} />
    </div>
  );
}
