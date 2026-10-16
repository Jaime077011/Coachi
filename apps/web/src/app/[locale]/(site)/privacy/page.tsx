import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/home/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.privacy");
  return { title: t("title") };
}

export default function PrivacyPage() {
  return <LegalPage page="privacy" />;
}
