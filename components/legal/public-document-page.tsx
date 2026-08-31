import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import {getFormatter, getTranslations} from "next-intl/server";

export type DocumentSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export async function PublicDocumentPage({
  title,
  summary,
  updatedAt,
  sections,
}: {
  readonly title: string;
  readonly summary: string;
  readonly updatedAt: Date;
  readonly sections: DocumentSection[];
}) {
  const t = await getTranslations("Legal");
  const format = await getFormatter();

  return (
    <>
      <Header />
      <main className="bg-white text-gray-950">
        <section className="border-b border-green-950/10 bg-green-50">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
            <p className="text-sm font-semibold text-green-800">
              {t("policies")}
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-[-0.03em] sm:text-6xl">
              {title}
            </h1>
            <p className="mt-6 max-w-[70ch] text-base leading-8 text-gray-700 sm:text-lg">
              {summary}
            </p>
            <p className="mt-6 text-sm text-gray-500">
              {t("lastUpdated", {date: format.dateTime(updatedAt, "long")})}
            </p>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-20 lg:px-8 lg:py-20">
          <aside
            className="lg:sticky lg:top-8 lg:self-start"
            aria-label={t("policyContents")}
          >
            <p className="text-sm font-semibold text-gray-950">{t("contents")}</p>
            <nav className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="min-h-11 shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 divide-y divide-gray-200">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 py-10 first:pt-0 last:pb-0"
              >
                <h2 className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
                  {section.title}
                </h2>
                <div className="mt-5 max-w-[72ch] space-y-4 text-[15px] leading-7 text-gray-600">
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets && (
                    <ul className="space-y-3 pl-5 marker:text-green-700">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="pl-1">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
