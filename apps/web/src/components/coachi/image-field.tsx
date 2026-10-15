"use client";

import { CameraIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const shapes = {
  /** Profile photo: square, small. */
  square: { width: 512, height: 512, box: "size-28 rounded-xl" },
  /** Landing page cover: wide banner. */
  wide: { width: 1500, height: 500, box: "aspect-[3/1] w-full rounded-lg" },
} as const;

/**
 * Pick a photo, crop it to the shape, shrink it, and hand back an image URL.
 * Mock mode keeps a small JPEG data URL; Step 4 uploads the same blob to the public
 * "avatars" bucket and stores its URL instead.
 */
export function ImageField({
  label,
  value,
  onChange,
  shape,
  fallback,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  shape: keyof typeof shapes;
  /** Shown in the empty square, e.g. the coach's initials. */
  fallback?: React.ReactNode;
}) {
  const t = useTranslations("parts.photo");
  const id = useId();
  const [busy, setBusy] = useState(false);
  const { width, height, box } = shapes[shape];

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await cropToJpeg(file, width, height));
    } catch {
      toast.error(t("failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div className={cn("flex gap-3", shape === "wide" ? "flex-col" : "items-center")}>
        <label
          htmlFor={id}
          className={cn(
            "relative grid shrink-0 cursor-pointer place-items-center overflow-hidden border-2 border-dashed bg-secondary/50 text-muted-foreground hover:bg-secondary focus-within:ring-2 focus-within:ring-ring",
            value && "border-solid",
            box,
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- local data URL or storage URL
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            (fallback ?? <CameraIcon className="size-6" aria-hidden />)
          )}
          {busy && (
            <span className="absolute inset-0 grid place-items-center bg-background/70">
              <Loader2Icon className="size-6 animate-spin" aria-hidden />
            </span>
          )}
          <input id={id} type="file" accept="image/*" className="sr-only" onChange={(e) => void pick(e.target.files?.[0])} aria-label={label} />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button asChild type="button" variant="secondary" size="sm">
            <label htmlFor={id} className="cursor-pointer">
              <CameraIcon data-icon="inline-start" />
              {value ? t("change") : t("add")}
            </label>
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onChange(null)}>
              <Trash2Icon data-icon="inline-start" />
              {t("remove")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Center-crop to width × height and encode as JPEG, so a phone photo becomes a few dozen KB. */
async function cropToJpeg(file: File, width: number, height: number) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.max(width / bitmap.width, height / bitmap.height);
  const w = Math.min(width, Math.round(bitmap.width * scale));
  const h = Math.min(height, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(bitmap, (bitmap.width - sw) / 2, (bitmap.height - sh) / 2, sw, sh, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}
