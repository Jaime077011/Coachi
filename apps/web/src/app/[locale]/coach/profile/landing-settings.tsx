"use client";

import type { CoachProfile } from "@coachi/validation";
import { CopyIcon, ExternalLinkIcon, GlobeIcon, MessageCircleIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { FieldError } from "@/components/coachi/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { whatsappUrl } from "@/lib/whatsapp";

type Fields = Pick<CoachProfile, "slug" | "headline" | "page_published" | "show_team">;

/** The landing page card at the top of the profile editor: link, share, on/off, headline. */
export function LandingSettings({
  value,
  savedSlug,
  slugError,
  onChange,
}: {
  value: Fields;
  /** Copy and Open use the saved link, so they never point at a link that isn't live yet. */
  savedSlug: string;
  slugError: "invalid" | "taken" | null;
  onChange: (patch: Partial<Fields>) => void;
}) {
  const t = useTranslations("landing");
  const locale = useLocale();
  const origin = globalThis.location?.origin ?? "https://coachi.app";
  const url = `${origin}/${locale}/c/${savedSlug}`;

  return (
    <section className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <GlobeIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <Label htmlFor="page-on" className="text-[15px] font-semibold">
              {t("cardTitle")}
            </Label>
            <p className="text-sm text-muted-foreground">{t("cardBody")}</p>
          </div>
        </div>
        <Switch id="page-on" checked={value.page_published} onCheckedChange={(v) => onChange({ page_published: v })} aria-label={t("published")} />
      </div>

      {value.page_published && (
        <>
          <p className="rounded-md bg-secondary p-3 text-sm font-semibold break-all" dir="ltr">
            {url}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                void navigator.clipboard?.writeText(url);
                toast.success(t("copied"));
              }}
            >
              <CopyIcon data-icon="inline-start" />
              {t("copy")}
            </Button>
            <Button asChild variant="secondary" size="sm">
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLinkIcon data-icon="inline-start" />
                {t("open")}
              </a>
            </Button>
            <Button asChild variant="secondary" size="sm">
              {/* No phone: WhatsApp asks who to send it to. */}
              <a href={whatsappUrl("", t("shareMessage", { url }))} target="_blank" rel="noreferrer">
                <MessageCircleIcon data-icon="inline-start" />
                {t("share")}
              </a>
            </Button>
          </div>
        </>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">{t("link")}</Label>
        <div className="flex items-center gap-1" dir="ltr">
          <span className="shrink-0 text-sm text-muted-foreground">/c/</span>
          <Input
            id="slug"
            value={value.slug}
            onChange={(e) => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
            aria-invalid={!!slugError}
            aria-describedby="slug-hint"
            maxLength={40}
          />
        </div>
        {slugError ? (
          <FieldError>{slugError === "taken" ? t("linkTaken") : t("linkInvalid")}</FieldError>
        ) : (
          <p id="slug-hint" className="text-xs text-muted-foreground">
            {t("linkHint")}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="headline">{t("headline")}</Label>
        <Input id="headline" maxLength={120} value={value.headline ?? ""} onChange={(e) => onChange({ headline: e.target.value || null })} placeholder={t("headlinePlaceholder")} />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="show-team" className="font-semibold">
            {t("showTeam")}
          </Label>
          <p className="text-sm text-muted-foreground">{t("showTeamBody")}</p>
        </div>
        <Switch id="show-team" checked={value.show_team} onCheckedChange={(v) => onChange({ show_team: v })} />
      </div>
    </section>
  );
}
