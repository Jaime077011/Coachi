import { CircleAlertIcon } from "lucide-react";

/** Message under the field in danger color, with an icon. Never only a red border. */
export function FieldError({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
      <CircleAlertIcon className="size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}
