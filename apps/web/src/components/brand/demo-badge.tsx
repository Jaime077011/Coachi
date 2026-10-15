import { dataSource } from "@coachi/core";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

/** Mock mode only: makes it obvious the data isn't real. */
export function DemoBadge() {
  const t = useTranslations("common");
  if (dataSource !== "mock") return null;
  return (
    <Badge variant="outline" className="border-warning/40 bg-warning/12 text-warning">
      {t("demo")}
    </Badge>
  );
}
