"use client";

import { ApiError } from "@coachi/core";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

/** One toast for a failed action, worded by why it failed: ended subscription, team role, or anything else. */
export function useApiErrorToast() {
  const t = useTranslations("readOnly");
  return (error: unknown) => {
    if (error instanceof ApiError && error.code === "inactive") toast.error(t("toast"));
    else if (error instanceof ApiError && error.code === "forbidden") toast.error(t("forbidden"));
    else toast.error(t("failed"));
  };
}
