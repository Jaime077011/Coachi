import { IntakeScreen } from "./intake-screen";

/** Intake form: 4 steps, no tab bar (outside the (tabs) group). */
export default function Page() {
  return (
    <main className="mx-auto w-full max-w-[560px] px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <IntakeScreen />
    </main>
  );
}
