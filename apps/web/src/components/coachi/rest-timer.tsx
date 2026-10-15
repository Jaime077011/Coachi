"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useFmt } from "@/lib/format";

/**
 * Bottom sheet with a ring countdown, +15 s and Skip. Buzzes at the end on Android
 * (iPhone web apps can't vibrate) and announces the last 3 seconds to screen readers.
 */
export function RestTimer({
  endsAt,
  total,
  onAdd,
  onClose,
}: {
  /** epoch ms; null = closed */
  endsAt: number | null;
  total: number;
  onAdd: (seconds: number) => void;
  onClose: () => void;
}) {
  const t = useTranslations("parts");
  const fmt = useFmt();
  const [now, setNow] = useState(() => Date.now());
  const buzzed = useRef(false);

  useEffect(() => {
    if (endsAt === null) return;
    buzzed.current = false;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endsAt]);

  const left = endsAt === null ? 0 : Math.min(total, Math.max(0, Math.ceil((endsAt - now) / 1000)));

  useEffect(() => {
    if (endsAt === null || left > 0 || buzzed.current) return;
    buzzed.current = true;
    navigator.vibrate?.([200, 100, 200]);
    const id = setTimeout(onClose, 1200);
    return () => clearTimeout(id);
  }, [left, endsAt, onClose]);

  // Move focus out before the sheet hides, so focus never sits inside aria-hidden content.
  const close = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    onClose();
  };

  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? left / total : 0;

  return (
    <Drawer open={endsAt !== null} onOpenChange={(open) => !open && close()}>
      <DrawerContent className="items-center pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <DrawerTitle className="mt-2">{left > 0 ? t("rest") : t("restDone")}</DrawerTitle>
        <DrawerDescription className="sr-only" aria-live="assertive">
          {left > 0 && left <= 3 ? t("secondsLeft", { s: left }) : left === 0 ? t("restDone") : ""}
        </DrawerDescription>
        <div className="relative my-4 grid size-52 place-items-center">
          <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90" aria-hidden>
            <defs>
              <linearGradient id="rest-fire" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FF7A45" />
                <stop offset="0.45" stopColor="#F2412E" />
                <stop offset="1" stopColor="#C8141E" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r={radius} fill="none" className="stroke-secondary" strokeWidth="12" />
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="url(#rest-fire)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-300 ease-linear motion-reduce:transition-none"
            />
          </svg>
          <span className="font-stat text-6xl tabular-nums" dir="ltr">
            {fmt.clock(left)}
          </span>
        </div>
        <div className="flex w-full max-w-sm gap-3 px-4">
          <Button variant="secondary" className="flex-1" onClick={() => onAdd(15)}>
            {t("addTime")}
          </Button>
          <Button variant="ghost" className="flex-1" onClick={close}>
            {t("skip")}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
