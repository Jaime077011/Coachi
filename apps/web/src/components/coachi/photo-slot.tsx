"use client";

import { CameraIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo } from "react";
import { cn } from "@/lib/utils";

/** Tap to take or pick a photo; shows a preview. Files go to private storage in Step 4. */
export function PhotoSlot({
  label,
  file,
  onChange,
  className,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  className?: string;
}) {
  const t = useTranslations("parts.photo");
  const id = useId();
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  return (
    <div className={cn("relative aspect-[3/4] overflow-hidden rounded-lg border-2 border-dashed", file && "border-solid", className)}>
      {file && preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview blob */}
          <img src={preview} alt={label} className="size-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`${t("remove")} ${label}`}
            className="absolute end-1 top-1 grid size-9 place-items-center rounded-full bg-background/80 backdrop-blur"
          >
            <XIcon className="size-4" aria-hidden />
          </button>
        </>
      ) : (
        <label
          htmlFor={id}
          className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 bg-secondary/50 p-2 text-center text-xs font-semibold text-muted-foreground hover:bg-secondary"
        >
          <CameraIcon className="size-6" aria-hidden />
          {label}
        </label>
      )}
      <input
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
