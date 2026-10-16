"use client";

import { DownloadIcon, Share2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "./responsive-dialog";

export type ShareContent = {
  /** The big number or word, e.g. "-6 kg" or "25". */
  headline: string;
  /** What it means, e.g. "25 workouts". */
  caption: string;
  coachName: string | null;
};

const W = 1080;
const H = 1350;

/** The font family next/font registered for a CSS variable (hashed names), with a fallback. */
function fontFamily(variable: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || fallback;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Draws a 1080 × 1350 milestone image with the coach's name: free marketing for the coach. */
async function render(content: ShareContent, locale: string, madeWith: string) {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const rtl = locale === "ar";
  const display = rtl ? fontFamily("--font-cairo", "sans-serif") : fontFamily("--font-anton", "sans-serif");
  const ui = rtl ? fontFamily("--font-cairo", "sans-serif") : fontFamily("--font-archivo", "sans-serif");

  // Ink background with a warm glow.
  ctx.fillStyle = "#040814";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, H * 0.42, 50, W / 2, H * 0.42, 700);
  glow.addColorStop(0, "rgba(242,65,46,0.35)");
  glow.addColorStop(1, "rgba(4,8,20,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // The mark at the top.
  const mark = await loadImage("/brand/coachi-mark-red-512-app.svg");
  ctx.drawImage(mark, W / 2 - 80, 120, 160, 160);

  ctx.textAlign = "center";
  ctx.direction = rtl ? "rtl" : "ltr";

  // Headline: numbers always in Anton.
  ctx.fillStyle = "#F4EFE6";
  ctx.font = `400 260px ${fontFamily("--font-anton", "sans-serif")}`;
  ctx.fillText(content.headline, W / 2, 720, W - 120);

  // Fire bar under the headline (never behind text).
  const fire = ctx.createLinearGradient(0, 780, 0, 800);
  fire.addColorStop(0, "#FF7A45");
  fire.addColorStop(0.45, "#F2412E");
  fire.addColorStop(1, "#C8141E");
  ctx.fillStyle = fire;
  ctx.beginPath();
  ctx.roundRect(W / 2 - 160, 780, 320, 16, 8);
  ctx.fill();

  ctx.fillStyle = "#F4EFE6";
  ctx.font = `${rtl ? 800 : 400} ${rtl ? 84 : 92}px ${display}`;
  ctx.fillText(rtl ? content.caption : content.caption.toUpperCase(), W / 2, 930, W - 120);

  if (content.coachName) {
    ctx.fillStyle = "#A9B1C2";
    ctx.font = `600 44px ${ui}`;
    ctx.fillText(content.coachName, W / 2, 1060, W - 120);
  }

  ctx.fillStyle = "#7C869B";
  ctx.font = `600 34px ${ui}`;
  ctx.fillText(madeWith, W / 2, H - 90);

  return new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
}

export function ShareCardDialog({
  open,
  onOpenChange,
  content,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: ShareContent;
}) {
  const t = useTranslations("share");
  const locale = useLocale();
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    let url: string | null = null;
    let cancelled = false;
    void render(content, locale, t("made")).then((blob) => {
      if (cancelled) return;
      url = URL.createObjectURL(blob);
      setImage({ blob, url });
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
      setImage(null);
    };
  }, [open, content, locale, t]);

  const file = image ? new File([image.blob], "coachi.png", { type: "image/png" }) : null;
  const canShare = !!file && typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [file] });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("title")}
      footer={
        <div className="flex w-full gap-2">
          {canShare && (
            <Button className="flex-1" onClick={() => void navigator.share({ files: [file!] }).catch(() => {})}>
              <Share2Icon data-icon="inline-start" />
              {t("shareBtn")}
            </Button>
          )}
          <Button asChild variant={canShare ? "secondary" : "default"} className="flex-1" disabled={!image}>
            <a href={image?.url} download="coachi.png">
              <DownloadIcon data-icon="inline-start" />
              {t("download")}
            </a>
          </Button>
        </div>
      }
    >
      <div className="mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden rounded-lg border bg-[#040814]">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element -- local generated image
          <img src={image.url} alt={`${content.headline} ${content.caption}`} className="size-full object-cover" />
        )}
      </div>
    </ResponsiveDialog>
  );
}
