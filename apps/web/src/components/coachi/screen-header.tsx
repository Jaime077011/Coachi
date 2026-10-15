import { ArrowLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Page title in the display font, with an optional back link and one action. */
export function ScreenHeader({
  title,
  subtitle,
  back,
  backLabel,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  back?: string;
  backLabel?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations("common");
  return (
    <header className={cn("mb-6 flex items-start gap-3", className)}>
      {back && (
        <Link
          href={back}
          aria-label={backLabel ?? t("back")}
          className="-ms-2 grid size-11 shrink-0 place-items-center rounded-md hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {/* Back arrows flip in Arabic. */}
          <ArrowLeftIcon className="size-6 rtl:rotate-180" aria-hidden />
        </Link>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h1 className="font-display text-[32px] leading-[1.1] uppercase lg:text-[44px]">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

/** Section label: small, bold, spaced (no spacing in Arabic, handled by the tokens). */
export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("mb-3 text-xs font-bold tracking-[0.12em] text-hint uppercase", className)}>{children}</h2>;
}

/** Just the back arrow, for screens whose title is part of a custom header. */
export function BackLink({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "-ms-2 grid size-11 place-items-center rounded-md hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      <ArrowLeftIcon className="size-6 rtl:rotate-180" aria-hidden />
    </Link>
  );
}
