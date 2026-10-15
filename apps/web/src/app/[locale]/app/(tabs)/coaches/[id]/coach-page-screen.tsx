"use client";

import { api } from "@coachi/core";
import type { CoachPage } from "@coachi/validation";
import { useQuery } from "@tanstack/react-query";
import { AtSignIcon, AwardIcon, BuildingIcon, LanguagesIcon, MapPinIcon, MessageCircleIcon, SendIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { use, useState } from "react";
import { cityName } from "@/components/coachi/coach-card";
import { QueryState } from "@/components/coachi/query-state";
import { PackageCard } from "@/components/coachi/package-card";
import { RequestDialog } from "@/components/coachi/request-dialog";
import { BackLink, SectionTitle } from "@/components/coachi/screen-header";
import { StatusChip, type Tone } from "@/components/coachi/status-chip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFmt } from "@/lib/format";
import { initials } from "@/lib/initials";
import { qk } from "@/lib/query-keys";
import { whatsappUrl } from "@/lib/whatsapp";

export function CoachPageScreen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const page = useQuery({ queryKey: qk.coachPage(id), queryFn: () => api.directory.get(id) });
  return <QueryState query={page}>{(data) => <CoachProfileView data={data} />}</QueryState>;
}

const statusTone: Record<"sent" | "accepted" | "declined", Tone> = { sent: "info", accepted: "success", declined: "neutral" };

function CoachProfileView({ data }: { data: CoachPage }) {
  const t = useTranslations("coachPage");
  const tParts = useTranslations("parts");
  const tCommon = useTranslations("common");
  const tLanding = useTranslations("landing");
  const fmt = useFmt();
  const [requesting, setRequesting] = useState(false);
  const [packageId, setPackageId] = useState<string | null>(null);
  const request = (pkg: string | null) => {
    setPackageId(pkg);
    setRequesting(true);
  };
  const c = data.profile;

  return (
    <div className="flex flex-col gap-6 pb-24">
      <BackLink href="/app/coaches" label={tCommon("back")} />
      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar className="size-24 rounded-xl">
          {c.photo_url && <AvatarImage src={c.photo_url} alt="" />}
          <AvatarFallback className="rounded-xl bg-secondary text-3xl font-bold">{initials(c.name)}</AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold">
          <bdi>{c.name}</bdi>
        </h1>
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPinIcon className="size-4" aria-hidden />
            {cityName(tParts, c.city)} · {tParts(`coachCard.${c.mode}`)}
          </span>
          <span>{t("experience", { years: c.years })}</span>
        </p>
        {c.price_min_piasters != null && c.price_max_piasters != null && (
          <p className="font-semibold tabular-nums">
            {tParts("coachCard.price", { min: fmt.num(c.price_min_piasters / 100, 0), max: fmt.num(c.price_max_piasters / 100, 0) })}
          </p>
        )}
      </div>

      <section>
        <SectionTitle>{t("about")}</SectionTitle>
        <p className="leading-relaxed">{c.bio}</p>
      </section>

      <section>
        <SectionTitle>{t("specialties")}</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {c.specialties.map((s) => (
            <Badge key={s} variant="secondary" className="h-7 px-3 text-sm">
              {tParts(`specialty.${s}`)}
            </Badge>
          ))}
        </div>
      </section>

      <section className="grid gap-3 rounded-lg border bg-card p-4 text-sm">
        {c.gym && (
          <Fact icon={BuildingIcon} label={t("gym")}>
            {c.gym}
          </Fact>
        )}
        <Fact icon={LanguagesIcon} label={t("languages")}>
          {c.languages.map((l) => t(`lang_${l}`)).join(" · ")}
        </Fact>
        {c.certificates.length > 0 && (
          <Fact icon={AwardIcon} label={t("certificates")}>
            {c.certificates.join(" · ")}
          </Fact>
        )}
        {c.instagram && (
          <Fact icon={AtSignIcon} label="Instagram">
            <a href={`https://instagram.com/${c.instagram}`} target="_blank" rel="noreferrer" className="text-primary hover:underline" dir="ltr">
              @{c.instagram}
            </a>
          </Fact>
        )}
      </section>

      {data.packages.length > 0 && (
        <section>
          <SectionTitle>{tLanding("packages")}</SectionTitle>
          <div className="flex flex-col gap-5 pt-2">
            {data.packages.map((p) => (
              <PackageCard key={p.id} pkg={p} onChoose={c.open_for_clients && !data.my_request ? () => request(p.id) : undefined} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle>{t("results")}</SectionTitle>
        {data.results.length === 0 ? <p className="text-sm text-muted-foreground">{t("noResults")}</p> : null}
      </section>

      {/* Sticky bottom bar: Send request + WhatsApp. Sits above the client tab bar. */}
      <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[560px] gap-2 px-4 py-3">
          {data.my_request ? (
            <StatusChip tone={statusTone[data.my_request.status]} className="h-12 flex-1 justify-center text-sm">
              {t(`status_${data.my_request.status}`)}
            </StatusChip>
          ) : c.open_for_clients ? (
            <Button className="flex-1" onClick={() => request(null)}>
              <SendIcon data-icon="inline-start" className="rtl:-scale-x-100" />
              {t("sendRequest")}
            </Button>
          ) : (
            <StatusChip tone="neutral" className="h-12 flex-1 justify-center text-sm">
              {t("closed")}
            </StatusChip>
          )}
          {c.whatsapp && (
            <Button asChild variant="secondary">
              <a href={whatsappUrl(c.whatsapp)} target="_blank" rel="noreferrer">
                <MessageCircleIcon data-icon="inline-start" />
                {t("whatsapp")}
              </a>
            </Button>
          )}
        </div>
      </div>

      <RequestDialog
        coachId={c.id}
        coachName={c.name}
        packages={data.packages}
        packageId={packageId}
        source="directory"
        open={requesting}
        onOpenChange={setRequesting}
      />
    </div>
  );
}

function Fact({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div>
        <p className="text-xs text-hint">{label}</p>
        <p className="font-semibold">{children}</p>
      </div>
    </div>
  );
}
