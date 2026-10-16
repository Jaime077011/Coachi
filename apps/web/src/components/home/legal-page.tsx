import { useTranslations } from "next-intl";

type Section = { title: string; body: string };

/** About, Privacy, and Terms: a title, a date, and sections from legal.<page> in the messages. */
export function LegalPage({ page }: { page: "about" | "privacy" | "terms" }) {
  const t = useTranslations(`legal.${page}`);
  const sections = t.raw("sections") as Section[];
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-sheen font-display text-[40px] leading-[1.1] uppercase lg:text-[56px]">{t("title")}</h1>
        <p className="text-sm text-hint">{t("updated")}</p>
        <p className="text-lg text-muted-foreground">{t("intro")}</p>
      </header>
      {sections.map((s) => (
        <section key={s.title} className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">{s.title}</h2>
          <p className="leading-relaxed whitespace-pre-line text-muted-foreground">{s.body}</p>
        </section>
      ))}
      {page === "about" && (
        <p className="border-t pt-6 text-sm text-hint">
          {/* Brand Guidelines: the arm mark is used with credit. */}
          {t.rich("credit", {
            link: (chunks) => (
              <a href="https://game-icons.net" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground">
                {chunks}
              </a>
            ),
            license: (chunks) => (
              <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground">
                {chunks}
              </a>
            ),
          })}
        </p>
      )}
    </article>
  );
}
