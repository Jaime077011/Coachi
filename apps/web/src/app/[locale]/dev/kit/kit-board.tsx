"use client";

import { localeDirection, messages, type Locale } from "@coachi/i18n";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  CircleMinusIcon,
  FlameIcon,
  InfoIcon,
  PlayIcon,
  Trash2Icon,
  TriangleAlertIcon,
  TrophyIcon,
} from "lucide-react";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { Logo, Mark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DirectionProvider } from "@/components/ui/direction";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const panels: { locale: Locale; theme: "dark" | "light" }[] = [
  { locale: "ar", theme: "dark" },
  { locale: "en", theme: "dark" },
  { locale: "ar", theme: "light" },
  { locale: "en", theme: "light" },
];

export function KitBoard() {
  return (
    <main className="grid gap-4 p-4 xl:grid-cols-2">
      {panels.map(({ locale, theme }) => (
        <NextIntlClientProvider key={`${locale}-${theme}`} locale={locale} messages={messages[locale]}>
          <DirectionProvider dir={localeDirection[locale]}>
            <div
              lang={locale}
              dir={localeDirection[locale]}
              className={cn(theme, "rounded-xl border bg-background p-4 text-foreground lg:p-6")}
            >
              <Panel theme={theme} />
            </div>
          </DirectionProvider>
        </NextIntlClientProvider>
      ))}
    </main>
  );
}

function Panel({ theme }: { theme: "dark" | "light" }) {
  const t = useTranslations("kit");
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Logo size="mobile" />
        <div className="flex items-center gap-2">
          <Mark size={32} />
          <Mark size={32} tile="red" />
          <Mark size={32} tile="cream" />
          <span className="text-xs text-hint">{theme}</span>
        </div>
      </header>

      <Section title={t("colors")}>
        <div className="grid grid-cols-5 gap-2">
          {[
            "bg-background",
            "bg-card",
            "bg-secondary",
            "bg-primary",
            "bg-fire",
            "bg-success",
            "bg-warning",
            "bg-destructive",
            "bg-info",
            "bg-muted-foreground",
          ].map((c) => (
            <div key={c} className="flex flex-col gap-1">
              <div className={cn(c, "h-10 rounded-sm border")} />
              <span className="truncate text-[10px] text-hint" dir="ltr">
                {c.replace("bg-", "")}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t("type")}>
        <p className="font-display text-[40px] leading-[1.05] uppercase lg:text-6xl">{t("display")}</p>
        <h1 className="font-display text-[32px] leading-[1.1] uppercase lg:text-[44px]">{t("h1")}</h1>
        <h2 className="text-2xl font-bold lg:text-3xl">{t("h2")}</h2>
        <p className="text-muted-foreground">{t("body")}</p>
        <div className="flex items-end gap-3">
          <span className="font-stat text-4xl leading-none tabular-nums lg:text-5xl" dir="ltr">
            12,450
          </span>
          <span className="pb-1 text-xs font-semibold text-muted-foreground">{t("statLabel")}</span>
        </div>
      </Section>

      <Section title={t("buttons")}>
        <div className="flex flex-wrap gap-2">
          <Button>
            <PlayIcon data-icon="inline-start" />
            {t("start")}
          </Button>
          <Button variant="secondary">{t("secondary")}</Button>
          <Button variant="ghost">{t("ghost")}</Button>
          <Button variant="destructive">
            <Trash2Icon data-icon="inline-start" />
            {t("danger")}
          </Button>
          <Button disabled>{t("start")}</Button>
        </div>
        <Button size="lg" className="w-full">
          {t("start")}
        </Button>
      </Section>

      <Section title={t("inputs")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`w-${theme}`}>{t("weight")}</Label>
            <Input id={`w-${theme}`} inputMode="decimal" dir="ltr" defaultValue="62.5" className="tabular-nums" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`p-${theme}`}>{t("phone")}</Label>
            <Input id={`p-${theme}`} type="tel" dir="ltr" defaultValue="+20 100 111 2233" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`n-${theme}`}>{t("note")}</Label>
          <Textarea id={`n-${theme}`} placeholder={t("notePlaceholder")} />
        </div>
        <div className="flex items-center gap-6">
          <Switch defaultChecked aria-label={t("done")} />
          <Checkbox defaultChecked aria-label={t("done")} />
          <Tabs defaultValue="a">
            <TabsList>
              <TabsTrigger value="a">{t("h2")}</TabsTrigger>
              <TabsTrigger value="b">{t("cards")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Section>

      <Section title={t("status")}>
        <div className="flex flex-wrap gap-2">
          <Chip tone="success" icon={CircleCheckIcon} label={t("done")} />
          <Chip tone="warning" icon={TriangleAlertIcon} label={t("attention")} />
          <Chip tone="destructive" icon={CircleAlertIcon} label={t("missed")} />
          <Chip tone="info" icon={InfoIcon} label={t("info")} />
          <Chip tone="neutral" icon={CircleMinusIcon} label={t("neutral")} />
        </div>
      </Section>

      <Section title={t("progress")}>
        <div className="h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={65}>
          <div className="h-full w-[65%] rounded-full bg-fire" />
        </div>
        <div className="flex items-center gap-2">
          <FlameIcon className="size-6 text-primary" aria-hidden />
          <span className="font-stat text-3xl tabular-nums">6</span>
        </div>
      </Section>

      <Section title={t("cards")}>
        <Card>
          <CardHeader>
            <CardTitle className="text-[17px] font-semibold">{t("cardTitle")}</CardTitle>
            <CardDescription className="text-xs">{t("cardMeta")}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <TrophyIcon className="size-5 text-success" aria-hidden />
            <span className="font-semibold">{t("pb")}</span>
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-bold tracking-[0.12em] text-hint uppercase">{title}</h3>
      {children}
    </section>
  );
}

const tones = {
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  destructive: "bg-destructive/12 text-destructive",
  info: "bg-info/12 text-info",
  neutral: "bg-secondary text-muted-foreground",
} as const;

/** Preview of StatusChip (built properly on day 3): icon + word, 12% fill. */
function Chip({
  tone,
  icon: Icon,
  label,
}: {
  tone: keyof typeof tones;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone])}>
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
