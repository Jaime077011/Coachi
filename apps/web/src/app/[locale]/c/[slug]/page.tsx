import { api } from "@coachi/core";
import type { Metadata } from "next";
import { Suspense } from "react";
import { LandingScreen, LandingSkeleton } from "./landing-screen";

/** Title and share preview from the coach's own name, headline, and photo. */
export async function generateMetadata({ params }: PageProps<"/[locale]/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { profile } = await api.directory.landing(slug);
    const description = profile.headline ?? profile.bio.slice(0, 160);
    return {
      title: profile.name,
      description,
      openGraph: { title: profile.name, description, type: "profile", images: profile.photo_url ? [profile.photo_url] : undefined },
    };
  } catch {
    // Unavailable page: keep the app's default title. The screen says what happened.
    return {};
  }
}

/** The coach's public page. No login, no app shell. Step 4 renders it on the server for search engines. */
export default function Page({ params }: PageProps<"/[locale]/c/[slug]">) {
  return (
    <Suspense fallback={<LandingSkeleton />}>
      <LandingScreen params={params} />
    </Suspense>
  );
}
