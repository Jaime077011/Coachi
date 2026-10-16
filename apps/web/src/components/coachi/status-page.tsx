import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";

/** Full-page message for 404 and crashes: logo, icon, words, and a way out. */
export function StatusPage({ icon: Icon, title, body, children }: { icon: LucideIcon; title: string; body: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-8 px-4 py-10 text-center">
      <Logo size="mobile" />
      <div className="flex flex-col items-center gap-3">
        <span className="grid size-14 place-items-center rounded-full bg-secondary text-muted-foreground">
          <Icon className="size-7" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{body}</p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">{children}</div>
    </main>
  );
}
