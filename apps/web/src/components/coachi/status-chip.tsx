import { CircleAlertIcon, CircleCheckIcon, CircleMinusIcon, InfoIcon, TriangleAlertIcon, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const tones: Record<Tone, { className: string; icon: LucideIcon }> = {
  success: { className: "bg-success/12 text-success", icon: CircleCheckIcon },
  warning: { className: "bg-warning/12 text-warning", icon: TriangleAlertIcon },
  danger: { className: "bg-destructive/12 text-destructive", icon: CircleAlertIcon },
  info: { className: "bg-info/12 text-info", icon: InfoIcon },
  neutral: { className: "bg-secondary text-muted-foreground", icon: CircleMinusIcon },
};

/** Icon + word, never color alone. Fill = status color at 12%. */
export function StatusChip({
  tone,
  icon,
  children,
  className,
}: {
  tone: Tone;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = icon ?? tones[tone].icon;
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        // Arabic: Cairo, bigger and bolder. Arabic letters at 12 px are too small to read.
        "rtl:gap-1.5 rtl:px-3 rtl:font-[family-name:var(--font-cairo)] rtl:text-sm rtl:leading-6 rtl:font-bold",
        tones[tone].className,
        className,
      )}
    >
      <Icon className="size-3.5 rtl:size-4" aria-hidden />
      {children}
    </span>
  );
}
