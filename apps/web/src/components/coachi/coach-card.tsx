"use client";

import type { CoachCard as CoachCardData } from "@coachi/validation";
import { MapPinIcon, StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { useFmt } from "@/lib/format";
import { initials } from "@/lib/initials";
import { cn } from "@/lib/utils";

/** Photo, name, specialties, city, online or in person, price range. */
export function CoachCard({ coach, href, className }: { coach: CoachCardData; href?: string; className?: string }) {
  const t = useTranslations("parts");
  const fmt = useFmt();
  const content = (
    <div className={cn("flex gap-3 rounded-lg border bg-card p-4 shadow-card transition-colors", href && "hover:border-primary/50", className)}>
      <Avatar className="size-16 rounded-lg">
        {coach.photo_url && <AvatarImage src={coach.photo_url} alt="" />}
        <AvatarFallback className="rounded-lg bg-secondary text-lg font-bold">{initials(coach.name)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-semibold">
            <bdi>{coach.name}</bdi>
          </p>
          {coach.featured && (
            <Badge variant="outline" className="shrink-0 gap-1 border-primary/40 text-primary">
              <StarIcon aria-hidden />
              {t("coachCard.featured")}
            </Badge>
          )}
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPinIcon className="size-3.5" aria-hidden />
          {cityName(t, coach.city)} · {t(`coachCard.${coach.mode}`)}
        </p>
        <div className="flex flex-wrap gap-1">
          {coach.specialties.slice(0, 3).map((s) => (
            <Badge key={s} variant="secondary" className="font-semibold">
              {t(`specialty.${s}`)}
            </Badge>
          ))}
        </div>
        {coach.price_min_piasters != null && coach.price_max_piasters != null && (
          <p className="text-xs font-semibold tabular-nums">
            {t("coachCard.price", {
              min: fmt.num(coach.price_min_piasters / 100, 0),
              max: fmt.num(coach.price_max_piasters / 100, 0),
            })}
          </p>
        )}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      {content}
    </Link>
  ) : (
    content
  );
}

type PartsT = ReturnType<typeof useTranslations<"parts">>;

/** Known cities are translated; anything else shows as typed. */
export function cityName(t: PartsT, city: string) {
  const key = `city.${city}` as Parameters<PartsT>[0];
  return t.has(key) ? t(key) : city;
}
