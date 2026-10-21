import { getDictionary, getLocale } from "@/lib/i18n";
import { MANUAL } from "@/lib/help/manual";
import { PageHeader } from "@/components/shell/page-header";
import { HelpSectionView } from "@/components/help/help-section";
import { ScrollToHash } from "@/components/help/scroll-to-hash";

/* The dashboard manual (lib/help/manual.ts), end to end. Each topic has an
   anchor, so the (i) panels link straight to theirs. */
export default async function HelpPage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.manual;

  const contents = (
    <nav aria-label={t.contents} className="grid gap-5">
      {MANUAL.map((chapter) => (
        <div key={chapter.title.en}>
          <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {chapter.title[locale]}
          </p>
          <ul className="grid gap-0.5">
            {chapter.topics.map((topic) => (
              <li key={topic.id}>
                <a
                  href={`#${topic.id}`}
                  className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {topic.title[locale]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div>
      <ScrollToHash />
      <PageHeader title={t.title} description={t.subtitle} />

      {/* On a phone the contents fold into one row above the manual. */}
      <details className="mb-6 rounded-xl border bg-card lg:hidden">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">{t.contents}</summary>
        <div className="border-t px-2 py-4">{contents}</div>
      </details>

      <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-20">{contents}</div>
        </aside>

        <div className="grid max-w-3xl gap-12">
          {MANUAL.map((chapter) => (
            <section key={chapter.title.en} className="grid gap-6">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {chapter.title[locale]}
              </h2>
              {chapter.topics.map((topic) => (
                <article
                  key={topic.id}
                  id={topic.id}
                  className="scroll-mt-20 rounded-xl border bg-card p-5 sm:p-6"
                >
                  <h3 className="text-xl font-semibold tracking-tight">{topic.title[locale]}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                    {topic.summary[locale]}
                  </p>
                  <div className="mt-6 grid gap-7">
                    {topic.sections.map((s, i) => (
                      <HelpSectionView key={i} section={s} locale={locale} labels={t} />
                    ))}
                  </div>
                </article>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
