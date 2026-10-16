import { OutboxRunner } from "@/components/coachi/outbox-runner";

/** Every client screen (tabs, intake, workout mode): keep the offline outbox sending. */
export default function ClientLayout({ children }: LayoutProps<"/[locale]/app">) {
  return (
    <>
      <OutboxRunner />
      {children}
    </>
  );
}
