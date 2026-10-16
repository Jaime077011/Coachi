import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HomePage } from "@/components/home/home-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home");
  return {
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription"), type: "website" },
  };
}

/** Coachi's own home page: what it is, pricing, and the "I'm a coach" form. The installed app opens at /start. */
export default function Page() {
  return <HomePage />;
}
