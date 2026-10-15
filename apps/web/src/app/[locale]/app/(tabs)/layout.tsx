import { BottomTabBar } from "@/components/shell/bottom-tab-bar";

/** Client shell: phone first, content centered in a 560 px column, 4-tab bar. */
export default function ClientTabsLayout({ children }: LayoutProps<"/[locale]/app">) {
  return (
    <>
      <main className="mx-auto w-full max-w-[560px] px-4 pt-6 pb-[calc(88px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomTabBar nav="client" />
    </>
  );
}
