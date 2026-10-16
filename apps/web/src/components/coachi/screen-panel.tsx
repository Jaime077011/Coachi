import { ScreenHeader } from "@/components/coachi/screen-header";
import { cn } from "@/lib/utils";

/**
 * A form or picker as its own screen (coach and admin never use pop-ups): title with a back
 * link, the content full width, and the actions underneath. Takes the same props the old
 * dialogs did, so a form moves from a pop-up to a page without changing its logic.
 */
export function ScreenPanel({
  title,
  description,
  back,
  backLabel,
  children,
  footer,
  className,
}: {
  title: string;
  description?: string;
  /** Where the back arrow goes (the screen this was opened from). */
  back: string;
  backLabel?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  /** Ignored: kept so old dialog call sites type-check while they move. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <div className={cn("flex w-full flex-col gap-6", className)}>
      <ScreenHeader title={title} subtitle={description} back={back} backLabel={backLabel} className="mb-0" />
      {children && <div className="flex flex-col gap-4">{children}</div>}
      {footer && <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">{footer}</div>}
    </div>
  );
}

/** Only in-app paths are allowed in ?back=, so a link can't send someone off-site. */
export function safeBack(value: string | null | undefined, fallback: string) {
  return value && /^\/(coach|admin)(\/|$)/.test(value) ? value : fallback;
}
