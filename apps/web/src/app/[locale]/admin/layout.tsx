import { Logo } from "@/components/brand/logo";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

/** Super admin shell: side menu on laptop; on phone the menu opens from the header. */
export default function AdminLayout({ children }: LayoutProps<"/[locale]/admin">) {
  return (
    <SidebarProvider>
      <AppSidebar nav="admin" />
      <SidebarInset className="bg-transparent">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b glass-strong px-4 lg:hidden">
          <SidebarTrigger className="size-11" />
          <Logo size="mobile" className="h-8 w-auto [&_img]:h-8 [&_img]:w-auto" />
        </header>
        <main className="mx-auto w-full max-w-[1200px] px-4 py-6 lg:px-6 lg:py-10">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
