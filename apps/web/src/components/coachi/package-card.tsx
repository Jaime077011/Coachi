"use client";

import type { CoachPackage } from "@coachi/validation";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFmt } from "@/lib/format";
import { cn } from "@/lib/utils";

/** One thing the coach sells: name, price, length, what's included. "Most popular" gets the primary border. */
export function PackageCard({ pkg, onChoose, className }: { pkg: Pick<CoachPackage, "name" | "price_piasters" | "weeks" | "includes" | "highlighted">; onChoose?: () => void; className?: string }) {
  const t = useTranslations("landing");
  const fmt = useFmt();
  return (
    <div className={cn("relative flex flex-col gap-4 rounded-lg border bg-card p-5", pkg.highlighted && "border-2 border-primary", className)}>
      {pkg.highlighted && <Badge className="absolute -top-3 start-4">{t("popular")}</Badge>}
      <div className="flex flex-col gap-1">
        <h3 dir="auto" className="text-lg font-semibold">{pkg.name}</h3>
        <p className="flex items-baseline gap-2">
          <span className="font-display text-[32px] leading-none tabular-nums">{fmt.egp(pkg.price_piasters)}</span>
          <span className="text-sm text-muted-foreground">{t("weeks", { count: pkg.weeks })}</span>
        </p>
      </div>
      {pkg.includes.length > 0 && (
        <ul className="flex flex-1 flex-col gap-2 text-sm">
          {pkg.includes.map((item, i) => (
            <li key={i} dir="auto" className="flex items-start gap-2">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      )}
      {onChoose && (
        <Button variant={pkg.highlighted ? "default" : "secondary"} onClick={onChoose}>
          {t("choose")}
        </Button>
      )}
    </div>
  );
}
