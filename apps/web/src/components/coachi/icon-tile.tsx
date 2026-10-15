import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Section icon in a softly lit glass tile: primary wash, hairline ring, faint fire glow. */
export function IconTile({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-primary/25 to-primary/5 text-primary shadow-[0_0_24px_-6px_var(--glow-fire)] ring-1 ring-primary/25",
        className,
      )}
    >
      <Icon className="size-5" />
    </span>
  );
}
