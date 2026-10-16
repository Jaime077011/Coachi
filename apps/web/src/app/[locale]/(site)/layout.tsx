import { Logo } from "@/components/brand/logo";
import { SiteFooter } from "@/components/home/home-page";
import { HomeHeaderActions } from "@/components/home/home-header-actions";
import { Link } from "@/i18n/navigation";

/** About, Privacy, Terms: the home page's header and footer around plain reading text. */
export default function SiteLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 glass-strong border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-2">
          <Link href="/" aria-label="Coachi">
            <Logo size="mobile" />
          </Link>
          <HomeHeaderActions />
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 lg:py-16">{children}</main>
      <SiteFooter />
    </div>
  );
}
