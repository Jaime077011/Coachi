import { Logo } from "./logo";

/** Shown while the app decides where to send you. */
export function BrandSplash() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background">
      <Logo size="web" className="animate-pulse motion-reduce:animate-none" />
    </main>
  );
}
