import { SupportBar } from "@/components/admin/support-mode";
import { ReadOnlyBanner } from "@/components/coach/read-only-banner";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { BottomTabBar } from "@/components/shell/bottom-tab-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/** Coach shell: tab bar on phone and tablet, side menu on laptop. */
export default function CoachLayout({ children }: LayoutProps<"/[locale]/coach">) {
  return (
    <SidebarProvider>
      <AppSidebar nav="coach" />
      <SidebarInset className="bg-transparent">
        <SupportBar />
        <ReadOnlyBanner />
        <main className="mx-auto w-full max-w-[1200px] px-4 pt-6 pb-[calc(88px+env(safe-area-inset-bottom))] lg:px-6 lg:pb-10">
          {children}
        </main>
      </SidebarInset>
      <BottomTabBar nav="coach" className="lg:hidden" />
    </SidebarProvider>
  );
}
