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
        tones[tone].className,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {children}
    </span>
  );
}
