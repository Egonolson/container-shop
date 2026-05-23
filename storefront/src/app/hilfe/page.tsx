import type { Metadata } from "next"
import Link from "next/link"
import { unstable_noStore as noStore } from "next/cache"
import { ArrowRight, ClipboardCheck, HelpCircle, Phone, ShieldCheck } from "lucide-react"
import { PublicShell } from "@/components/public/public-shell"
import { Button } from "@/components/ui/button"
import { getHelpContent } from "@/lib/help-content.server"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://containerdienst-seyfarth.onepage.me"

export const metadata: Metadata = {
  title: "Hilfe zur Containerbestellung und Entsorgung | Seyfarth",
  description:
    "Antworten zu Containergröße, Abfallarten, gefährlichen Stoffen, Verpackung, Befüllung, Stellplatz und Abholung beim Containerdienst Seyfarth.",
  alternates: { canonical: "/hilfe" },
}

function topicHref(slug: string) {
  return `/hilfe#${slug}`
}

function renderBlocks(blocks: ReturnType<typeof getHelpContent>["topics"][number]["blocks"]) {
  return blocks.map((block, index) => {
    if (block.type === "paragraph") {
      return <p key={index} className="mt-3 text-sm leading-relaxed text-zinc-600">{block.text}</p>
    }

    return (
      <ul key={index} className="mt-4 space-y-2 text-sm leading-relaxed text-zinc-600">
        {block.items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-seyfarth-blue" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    )
  })
}

export default function HelpPage() {
  noStore()
  const content = getHelpContent()
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/hilfe#webpage`,
        url: `${siteUrl}/hilfe`,
        name: content.hero.title,
        description: content.hero.intro,
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/hilfe#faq`,
        mainEntity: content.faqs.slice(0, 12).map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  }

  return (
    <PublicShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="relative -mt-20 overflow-hidden bg-[linear-gradient(135deg,#071B3B_0%,#0F3C82_58%,#2579F0_100%)] pb-20 pt-36 md:pb-28 md:pt-44">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 top-0 h-full w-[620px] origin-top-right skew-x-[-12deg] bg-white/10" />
          <div className="absolute -right-10 top-20 h-[300px] w-[300px] rounded-full bg-seyfarth-yellow/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-seyfarth-yellow">Seyfarth Hilfe</p>
          <h1 className="max-w-4xl font-headline text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">{content.hero.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-blue-100/85">{content.hero.intro}</p>
          <div className="mt-8 max-w-3xl rounded-[24px] border border-white/15 bg-white/10 p-5 text-blue-50 shadow-xl backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-seyfarth-yellow">Kurz zusammengefasst</p>
            <p className="mt-2 text-sm leading-relaxed">{content.hero.tldr}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="rounded-xl bg-seyfarth-yellow px-6 py-5 font-bold text-seyfarth-navy hover:bg-white">
              <Link href="/#katalog">Anfrage starten <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl border-white/45 bg-transparent px-6 py-5 font-semibold text-white hover:bg-white/10">
              <a href="tel:03449155200"><Phone className="mr-2 h-4 w-4" /> Beratung anrufen</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 lg:grid-cols-[320px_1fr]">
          <aside className="h-fit rounded-[28px] border border-zinc-100 bg-white p-6 shadow-sm lg:sticky lg:top-28">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-seyfarth-blue">Direkt zu den Hinweisen</p>
            <nav className="mt-4 space-y-2" aria-label="Hilfethemen">
              {content.topics.map((topic) => (
                <Link key={topic.slug} href={topicHref(topic.slug)} className="block rounded-xl px-3 py-2 text-sm font-semibold text-seyfarth-navy hover:bg-seyfarth-blue/5 hover:text-seyfarth-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue">
                  {topic.title}
                </Link>
              ))}
            </nav>
          </aside>

          <div className="space-y-6">
            {content.topics.map((topic) => (
              <article key={topic.slug} id={topic.slug} className="scroll-mt-32 rounded-[28px] border border-zinc-100 bg-white p-6 shadow-sm md:p-8">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-seyfarth-blue/10 text-seyfarth-blue">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-headline text-2xl font-extrabold text-seyfarth-navy md:text-3xl">{topic.title}</h2>
                    <p className="mt-2 text-base leading-relaxed text-zinc-600">{topic.summary}</p>
                  </div>
                </div>
                {renderBlocks(topic.blocks)}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-seyfarth-blue">Fragen und Antworten</p>
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-seyfarth-navy md:text-4xl">Häufige Fragen zur Containerbestellung</h2>
            <p className="mx-auto mt-3 max-w-2xl text-zinc-500">Die Antworten sind bewusst kurz gehalten. Bei Sonderfällen prüft Seyfarth Ihre Angaben persönlich.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {content.faqs.map((item) => (
              <article key={item.question} className="rounded-[24px] border border-zinc-100 bg-zinc-50 p-6">
                <div className="mb-3 flex items-start gap-3">
                  <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-seyfarth-blue" />
                  <h3 className="font-bold text-seyfarth-navy">{item.question}</h3>
                </div>
                <p className="text-sm leading-relaxed text-zinc-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-seyfarth-navy py-20 text-center text-white">
        <div className="mx-auto max-w-4xl px-6">
          <ClipboardCheck className="mx-auto mb-5 h-12 w-12 text-seyfarth-yellow" />
          <h2 className="font-headline text-3xl font-extrabold md:text-5xl">Unsicher bei Material, Menge oder Stellplatz?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-blue-100/85">Senden Sie Ihre Anfrage mit möglichst vielen Angaben ab. Seyfarth prüft unklare Fälle persönlich und meldet sich vor einer verbindlichen Bestätigung.</p>
          <Button asChild className="mt-8 rounded-xl bg-seyfarth-yellow px-8 py-6 text-base font-bold text-seyfarth-navy hover:bg-white">
            <Link href="/#katalog">Kostenlose Anfrage starten</Link>
          </Button>
        </div>
      </section>
    </PublicShell>
  )
}
