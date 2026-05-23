import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { unstable_noStore as noStore } from "next/cache"
import { ArrowLeft, ClipboardCheck, Phone } from "lucide-react"
import { PublicShell } from "@/components/public/public-shell"
import { Button } from "@/components/ui/button"
import { getHelpContent, getTopicBySlug } from "@/lib/help-content.server"

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getHelpContent().topics.map((topic) => ({ slug: topic.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const topic = getTopicBySlug(slug)
  if (!topic) return {}
  return {
    title: `${topic.title} | Seyfarth Hilfe`,
    description: topic.summary,
    alternates: { canonical: `/hilfe/${topic.slug}` },
  }
}

export default async function HelpTopicPage({ params }: PageProps) {
  noStore()
  const { slug } = await params
  const topic = getTopicBySlug(slug)
  if (!topic) notFound()

  return (
    <PublicShell>
      <section className="relative -mt-20 overflow-hidden bg-[linear-gradient(135deg,#071B3B_0%,#0F3C82_58%,#2579F0_100%)] pb-20 pt-36 md:pt-44">
        <div className="relative mx-auto max-w-4xl px-6">
          <Link href="/hilfe" className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-blue-100 hover:text-seyfarth-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-yellow">
            <ArrowLeft className="h-4 w-4" /> Zur Hilfe-Übersicht
          </Link>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-seyfarth-yellow">Seyfarth Hinweis</p>
          <h1 className="font-headline text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">{topic.title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-blue-100/85">{topic.summary}</p>
        </div>
      </section>

      <section className="bg-zinc-50 py-16">
        <article className="mx-auto max-w-4xl rounded-[28px] border border-zinc-100 bg-white p-6 shadow-sm md:p-10">
          <div className="space-y-5">
            {topic.blocks.map((block, index) => {
              if (block.type === "paragraph") {
                return <p key={index} className="text-base leading-relaxed text-zinc-700">{block.text}</p>
              }
              return (
                <ul key={index} className="space-y-3 text-base leading-relaxed text-zinc-700">
                  {block.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-seyfarth-blue" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )
            })}
          </div>
          <div className="mt-10 rounded-[24px] bg-seyfarth-navy p-6 text-white">
            <ClipboardCheck className="mb-4 h-8 w-8 text-seyfarth-yellow" />
            <h2 className="text-xl font-bold">Sonderfall oder Unsicherheit?</h2>
            <p className="mt-2 text-sm leading-relaxed text-blue-100/85">Senden Sie Ihre Anfrage ab oder rufen Sie an. Seyfarth prüft die Angaben persönlich, bevor eine verbindliche Bestätigung erfolgt.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild className="rounded-xl bg-seyfarth-yellow font-bold text-seyfarth-navy hover:bg-white">
                <Link href="/#katalog">Anfrage starten</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-white/45 bg-transparent text-white hover:bg-white/10">
                <a href="tel:03449155200"><Phone className="mr-2 h-4 w-4" />034491 5520-0</a>
              </Button>
            </div>
          </div>
        </article>
      </section>
    </PublicShell>
  )
}
