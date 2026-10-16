import { notFound } from "next/navigation";

/** Any unknown path under /ar or /en: show the localized 404 (not-found.tsx) inside the app's layout. */
export default function CatchAll() {
  notFound();
}
