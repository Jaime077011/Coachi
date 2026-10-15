"use client";

import { api, ApiError } from "@coachi/core";
import type { CoachLanding } from "@coachi/validation";
import { useQuery } from "@tanstack/react-query";
import { AtSignIcon, AwardIcon, BuildingIcon, EyeIcon, LanguagesIcon, MapPinIcon, MessageCircleIcon, PencilIcon, SearchIcon, SendIcon, UnplugIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { use, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { cityName } from "@/components/coachi/coach-card";
import { PackageCard } from "@/components/coachi/package-card";
import { RequestDialog } from "@/components/coachi/request-dialog";
import { SectionTitle } from "@/components/coachi/screen-header";
import { EmptyState, ErrorState } from "@/components/coachi/states";
import { StatusChip } from "@/components/coachi/status-chip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { Link, usePathname } from "@/i18n/navigation";
import { useFmt } from "@/lib/format";
import { initials } from "@/lib/initials";
import { qk } from "@/lib/query-keys";
import { whatsappUrl } from "@/lib/whatsapp";

export function LandingScreen({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const page = useQuery({
    queryKey: qk.landing(slug),
    queryFn: () => api.directory.landing(slug),
    // A missing page won't appear on retry.
    retry: (count, error) => !(error instanceof ApiError && error.code === "not_found") && count < 2,
  });

  if (page.isPending) return <LandingSkeleton />;
  if (page.isError) {
    return (
      <Shell>
        {page.error instanceof ApiError && page.error.code === "not_found" ? (
          <Unavailable />
        ) : (
          <ErrorState onRetry={() => void page.refetch()} className="mt-10" />
        )}
      </Shell>
    );
  }
  return <Landing data={page.data} />;
}

/** Top bar (name + language switch), content, "Made with Coachi" footer. */
function Shell({ name, children }: { name?: string; children: React.ReactNode }) {
  const t = useTranslations("landing");
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === "ar" ? "en" : "ar";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <span className="truncate font-semibold">{name && <bdi>{name}</bdi>}</span>
        <Button asChild variant="ghost" size="sm">
          <Link href={pathname} locale={other} lang={other}>
            {other === "ar" ? "عربي" : "English"}
          </Link>
        </Button>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4">{children}</main>
      <footer className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2 px-4 pt-12 pb-[calc(96px+env(safe-area-inset-bottom))] text-xs text-hint sm:pb-10">
        <span>{t("madeWith")}</span>
        <Link href="/" aria-label="Coachi">
          <Logo size="mobile" />
        </Link>
      </footer>
    </div>
  );
}

function Unavailable() {
  const t = useTranslations("landing");
  return (
    <EmptyState
      icon={UnplugIcon}
      title={t("unavailableTitle")}
      body={t("unavailableBody")}
      className="mt-10"
      action={
        <Button asChild>
          <Link href="/app/coaches">
            <SearchIcon data-icon="inline-start" />
            {t("findCoach")}
          </Link>
        </Button>
      }
    />
  );
}

function Landing({ data }: { data: CoachLanding }) {
  const t = useTranslations("landing");
  const tCp = useTranslations("coachPage");
  const tParts = useTranslations("parts");
  const tTeam = useTranslations("team");
  const fmt = useFmt();
  const session = useSession();
  const c = data.profile;
  const [requesting, setRequesting] = useState(false);
  const [packageId, setPackageId] = useState<string | null>(null);
  const isOwnPage = session.data?.coach_id === c.id;

  // The sticky bar on phone shows once the hero's buttons scroll away.
  const heroCta = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  useEffect(() => {
    const el = heroCta.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setHeroVisible(entry!.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const start = (pkg: string | null) => {
    setPackageId(pkg);
    setRequesting(true);
  };

  const ctas = (
    <>
      {c.open_for_clients ? (
        <Button size="lg" className="flex-1 sm:flex-none" onClick={() => start(null)} disabled={isOwnPage}>
          <SendIcon data-icon="inline-start" className="rtl:-scale-x-100" />
          {t("startWith")}
        </Button>
      ) : (
        <StatusChip tone="neutral" className="h-12 flex-1 justify-center text-sm sm:flex-none sm:px-4">
          {tCp("closed")}
        </StatusChip>
      )}
      {c.whatsapp && (
        <Button asChild size="lg" variant="secondary">
          <a href={whatsappUrl(c.whatsapp, t("whatsappMessage"))} target="_blank" rel="noreferrer">
            <MessageCircleIcon data-icon="inline-start" />
            {tCp("whatsapp")}
          </a>
        </Button>
      )}
    </>
  );

  return (
    <Shell name={c.name}>
      {isOwnPage && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-info/40 bg-info/12 p-3 text-sm text-info">
          <EyeIcon className="size-5 shrink-0" aria-hidden />
          <span className="flex-1 font-semibold">{t("previewBar")}</span>
          <Button asChild size="sm" variant="secondary">
            <Link href="/coach/profile">
              <PencilIcon data-icon="inline-start" />
              {t("editPage")}
            </Link>
          </Button>
        </div>
      )}

      {/* Hero */}
      <section className="flex flex-col items-center gap-4 text-center">
        <div className="relative w-full">
          <div className="h-36 w-full overflow-hidden rounded-lg border bg-card sm:h-48">
            {c.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element -- coach uploads, any host
              <img src={c.cover_url} alt="" className="size-full object-cover" />
            )}
          </div>
          <Avatar className="absolute start-1/2 -bottom-12 size-28 -translate-x-1/2 rounded-xl border-4 border-background rtl:translate-x-1/2">
            {c.photo_url && <AvatarImage src={c.photo_url} alt="" />}
            <AvatarFallback className="rounded-xl bg-secondary text-4xl font-bold">{initials(c.name)}</AvatarFallback>
          </Avatar>
        </div>
        <div className="mt-12 flex flex-col items-center gap-2">
          <h1 className="font-display text-[40px] leading-[1.05] uppercase sm:text-[56px]">
            <bdi>{c.name}</bdi>
          </h1>
          {c.headline && <p className="max-w-xl text-lg text-muted-foreground">{c.headline}</p>}
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPinIcon className="size-4" aria-hidden />
              {cityName(tParts, c.city)} · {tParts(`coachCard.${c.mode}`)}
            </span>
            <span>{tCp("experience", { years: c.years })}</span>
          </p>
          {data.packages.length === 0 && c.price_min_piasters != null && c.price_max_piasters != null && (
            <p className="font-semibold tabular-nums">
              {tParts("coachCard.price", { min: fmt.num(c.price_min_piasters / 100, 0), max: fmt.num(c.price_max_piasters / 100, 0) })}
            </p>
          )}
        </div>
        <div ref={heroCta} className="flex w-full gap-2 sm:w-auto">
          {ctas}
        </div>
      </section>

      <div className="mt-12 flex flex-col gap-12">
        <section>
          <SectionTitle>{tCp("about")}</SectionTitle>
          <p className="text-[17px] leading-relaxed whitespace-pre-line">{c.bio}</p>
          {c.specialties.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {c.specialties.map((s) => (
                <Badge key={s} variant="secondary" className="h-8 px-3 text-sm">
                  {tParts(`specialty.${s}`)}
                </Badge>
              ))}
            </div>
          )}
        </section>

        {data.packages.length > 0 && (
          <section>
            <SectionTitle>{t("packages")}</SectionTitle>
            <div className="grid gap-5 pt-2 sm:grid-cols-2">
              {data.packages.map((p) => (
                <PackageCard key={p.id} pkg={p} onChoose={c.open_for_clients && !isOwnPage ? () => start(p.id) : undefined} />
              ))}
            </div>
          </section>
        )}

        {data.results.length > 0 && (
          <section>
            <SectionTitle>{tCp("results")}</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              {data.results.map((r) => (
                <figure key={r.id} className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element -- signed storage links */}
                    <img src={r.before_url} alt={t("before")} className="aspect-[3/4] object-cover" />
                    {/* eslint-disable-next-line @next/next/no-img-element -- signed storage links */}
                    <img src={r.after_url} alt={t("after")} className="aspect-[3/4] object-cover" />
                  </div>
                  {r.caption && <figcaption className="text-sm text-muted-foreground">{r.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}

        {data.team.length > 0 && (
          <section>
            <SectionTitle>{t("team")}</SectionTitle>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data.team.map((m, i) => (
                <li key={i} className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-center">
                  <Avatar className="size-16">
                    {m.avatar_url && <AvatarImage src={m.avatar_url} alt="" />}
                    <AvatarFallback className="bg-secondary text-lg font-bold">{initials(m.name)}</AvatarFallback>
                  </Avatar>
                  <bdi className="font-semibold">{m.name}</bdi>
                  <span className="text-xs text-muted-foreground">{tTeam(`role_${m.role}`)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="grid gap-3 rounded-lg border bg-card p-4 text-sm">
          {c.gym && (
            <Fact icon={BuildingIcon} label={tCp("gym")}>
              {c.gym}
            </Fact>
          )}
          <Fact icon={LanguagesIcon} label={tCp("languages")}>
            {c.languages.map((l) => tCp(`lang_${l}`)).join(" · ")}
          </Fact>
          {c.certificates.length > 0 && (
            <Fact icon={AwardIcon} label={tCp("certificates")}>
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

        {c.open_for_clients && !isOwnPage && (
          <section className="flex flex-col items-center gap-3 rounded-lg border bg-card px-6 py-10 text-center">
            <h2 className="font-display text-[32px] leading-tight uppercase">{t("ctaTitle")}</h2>
            <p className="max-w-md text-muted-foreground">{t("ctaBody", { coach: c.name })}</p>
            <Button size="lg" onClick={() => start(null)}>
              <SendIcon data-icon="inline-start" className="rtl:-scale-x-100" />
              {t("startWith")}
            </Button>
          </section>
        )}
      </div>

      {/* Phone: sticky Start bar once the hero buttons are off screen. */}
      {!heroVisible && !isOwnPage && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-3xl gap-2 px-4 py-3">{ctas}</div>
        </div>
      )}

      <RequestDialog
        coachId={c.id}
        coachName={c.name}
        packages={data.packages}
        packageId={packageId}
        source="landing"
        open={requesting}
        onOpenChange={setRequesting}
      />
    </Shell>
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

export function LandingSkeleton() {
  const t = useTranslations("common");
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 pt-14" aria-busy aria-label={t("loading")}>
      <Skeleton className="h-36 w-full rounded-lg sm:h-48" />
      <Skeleton className="size-28 rounded-xl" />
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-5 w-80 max-w-full" />
      <Skeleton className="mt-6 h-40 w-full rounded-lg" />
    </div>
  );
}
