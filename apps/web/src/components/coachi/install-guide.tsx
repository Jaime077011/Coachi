"use client";

import { DownloadIcon, PlusSquareIcon, ShareIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Mark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DISMISS_KEY = "coachi.install.dismissed";
const EVENT = "coachi:install";

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
// iPhone/iPad Safari (iPadOS reports as Mac, so check for touch too).
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && navigator.maxTouchPoints > 1);

function useHidden() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENT, cb);
      return () => window.removeEventListener(EVENT, cb);
    },
    () => {
      try {
        return isStandalone() || localStorage.getItem(DISMISS_KEY) === "1";
      } catch {
        return isStandalone();
      }
    },
    () => true,
  );
}

/**
 * "Add Coachi to your home screen". iPhone has no install button, so it shows the two steps
 * (Share, then Add to Home Screen). Android/Chrome gets a real Install button. Shown until
 * installed or closed.
 */
export function InstallGuide({ className }: { className?: string }) {
  const t = useTranslations("install");
  const hidden = useHidden();
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the browser once, after hydration
    setIos(isIos());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => window.dispatchEvent(new Event(EVENT));
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden || (!ios && !prompt)) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(EVENT));
  };

  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Mark size={40} />
          <div className="flex flex-1 flex-col gap-0.5">
            <p className="font-semibold">{t("title")}</p>
            <p className="text-sm text-muted-foreground">{t("body")}</p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label={t("close")} title={t("close")} onClick={dismiss}>
            <XIcon />
          </Button>
        </div>
        {ios ? (
          <ol className="flex flex-col gap-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary font-semibold tabular-nums">1</span>
              {t.rich("iosStep1", { icon: () => <ShareIcon className="inline size-4 text-info" aria-label={t("shareIcon")} /> })}
            </li>
            <li className="flex items-center gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary font-semibold tabular-nums">2</span>
              {t.rich("iosStep2", { icon: () => <PlusSquareIcon className="inline size-4" aria-hidden /> })}
            </li>
          </ol>
        ) : (
          <Button
            onClick={async () => {
              if (!prompt) return;
              await prompt.prompt();
              const { outcome } = await prompt.userChoice;
              setPrompt(null);
              if (outcome === "accepted") dismiss();
            }}
          >
            <DownloadIcon data-icon="inline-start" />
            {t("install")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
