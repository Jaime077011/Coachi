import {
  ClipboardListIcon,
  DumbbellIcon,
  GlobeIcon,
  LineChartIcon,
  SmartphoneIcon,
  UtensilsIcon,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { IconTile } from "@/components/coachi/icon-tile";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { CoachLeadForm } from "./coach-lead-form";
import { HomeHeaderActions } from "./home-header-actions";
import { PricingSection } from "./pricing-section";

const features: { key: string; icon: LucideIcon }[] = [
  { key: "file", icon: ClipboardListIcon },
  { key: "workouts", icon: DumbbellIcon },
  { key: "meals", icon: UtensilsIcon },
  { key: "progress", icon: LineChartIcon },
  { key: "clientApp", icon: SmartphoneIcon },
  { key: "page", icon: GlobeIcon },
];

const faqs = ["clientsPay", "howPay", "arabic", "store", "data"] as const;

/** Server-rendered for search engines; the header buttons, pricing, and form are small client parts. */
export function HomePage() {
  const t = useTranslations("home");
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 glass-strong border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-2">
          <Link href="/" aria-label="Coachi">
            <Logo size="mobile" />
          </Link>
          <HomeHeaderActions />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-20 px-4 pt-12 pb-16 lg:gap-28 lg:pt-20">
        {/* Hero */}
        <section className="flex flex-col items-start gap-6 lg:max-w-3xl">
          <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">{t("eyebrow")}</p>
          <h1 className="text-sheen font-display text-[44px] leading-[1.05] uppercase sm:text-[64px] lg:text-[80px]">{t("heroTitle")}</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">{t("heroBody")}</p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg">
              <a href="#coaches">{t("ctaCoach")}</a>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/app/coaches">{t("ctaClient")}</Link>
            </Button>
          </div>
          <p className="text-sm text-hint">{t("heroNote")}</p>
        </section>

        {/* Features */}
        <section aria-labelledby="features-title" className="flex flex-col gap-8">
          <SectionHeading id="features-title" title={t("featuresTitle")} body={t("featuresBody")} />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ key, icon }) => (
              <li key={key} className="flex flex-col gap-3 rounded-xl border bg-card p-5">
                <IconTile icon={icon} />
                <h3 className="text-[17px] font-semibold">{t(`feature_${key}_title` as Parameters<typeof t>[0])}</h3>
                <p className="text-sm text-muted-foreground">{t(`feature_${key}_body` as Parameters<typeof t>[0])}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-title" className="flex flex-col gap-8">
          <SectionHeading id="how-title" title={t("howTitle")} />
          <ol className="grid gap-4 sm:grid-cols-3">
            {([1, 2, 3] as const).map((n) => (
              <li key={n} className="flex flex-col gap-2 rounded-xl border bg-card p-5">
                <span className="font-display text-5xl leading-none text-primary tabular-nums">{n}</span>
                <h3 className="text-[17px] font-semibold">{t(`step${n}_title`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`step${n}_body`)}</p>
              </li>
            ))}
          </ol>
        </section>

        <PricingSection />

        {/* "I'm a coach" form */}
        <section id="coaches" aria-labelledby="coaches-title" className="grid scroll-mt-20 gap-8 lg:grid-cols-2">
          <SectionHeading id="coaches-title" title={t("formTitle")} body={t("formBody")} />
          <div className="rounded-xl border bg-card p-5 sm:p-6">
            <CoachLeadForm />
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-title" className="flex flex-col gap-6 lg:max-w-3xl">
          <SectionHeading id="faq-title" title={t("faqTitle")} />
          <Accordion type="single" collapsible>
            {faqs.map((q) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-start text-[17px] font-semibold hover:no-underline">{t(`faq_${q}_q`)}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{t(`faq_${q}_a`)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function SectionHeading({ id, title, body }: { id: string; title: string; body?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 id={id} className="font-display text-[32px] leading-[1.1] uppercase lg:text-[44px]">
        {title}
      </h2>
      {body && <p className="max-w-2xl text-muted-foreground">{body}</p>}
    </div>
  );
}

/** Shared by the home page and the About / Privacy / Terms pages. */
export function SiteFooter() {
  const t = useTranslations("home");
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label={t("footerNav")} className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/about" className="hover:text-foreground">
            {t("about")}
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            {t("privacy")}
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            {t("terms")}
          </Link>
          <Link href="/login" className="hover:text-foreground">
            {t("login")}
          </Link>
        </nav>
        <p className="text-hint">{t("copyright", { year: 2026 })}</p>
      </div>
    </footer>
  );
}
