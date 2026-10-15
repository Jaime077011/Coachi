import { Logo } from "@/components/brand/logo";

/** Login and join: plain, centered. */
export default function AuthLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-8 px-4 py-10">
      <Logo size="web" />
      <div className="w-full">{children}</div>
    </main>
  );
}
