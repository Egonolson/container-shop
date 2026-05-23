import { existsSync, readFileSync, writeFileSync } from "node:fs"

export type HelpBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }

export interface HelpTopic {
  slug: string
  title: string
  summary: string
  blocks: HelpBlock[]
}

export interface HelpFaq {
  question: string
  answer: string
}

export interface HelpContent {
  version: "seyfarth-help-v1"
  updatedAt: string
  hero: {
    title: string
    intro: string
    tldr: string
  }
  noticeLinks: Array<{ slug: string; label: string }>
  topics: HelpTopic[]
  faqs: HelpFaq[]
}

const SLUG_PATTERN = /^[a-z0-9-]+$/
const TEXT_LIMIT = 1200
const TITLE_LIMIT = 140
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function assertString(value: unknown, path: string, maxLength = TEXT_LIMIT) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    throw new Error(`${path} muss ein nicht leerer Text mit maximal ${maxLength} Zeichen sein.`)
  }
}

function assertExactKeys(value: Record<string, unknown>, allowedKeys: string[], path: string) {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) throw new Error(`${path}.${key} ist nicht erlaubt.`)
  }
}

function validateBlock(value: unknown, path: string): HelpBlock {
  if (!isRecord(value)) throw new Error(`${path} muss ein Objekt sein.`)
  if (value.type === "paragraph") {
    assertExactKeys(value, ["type", "text"], path)
    assertString(value.text, `${path}.text`)
    return { type: "paragraph", text: String(value.text).trim() }
  }
  if (value.type === "list") {
    assertExactKeys(value, ["type", "items"], path)
    if (!Array.isArray(value.items) || value.items.length === 0 || value.items.length > 12) throw new Error(`${path}.items muss eine Liste sein.`)
    const items = value.items.map((item, index) => {
      assertString(item, `${path}.items[${index}]`, 220)
      return String(item).trim()
    })
    return { type: "list", items }
  }
  throw new Error(`${path}.type ist ungültig.`)
}

export function validateHelpContentJson(value: unknown): HelpContent {
  if (!isRecord(value)) throw new Error("help-content muss ein Objekt sein.")
  assertExactKeys(value, ["version", "updatedAt", "hero", "noticeLinks", "topics", "faqs"], "help-content")
  if (value.version !== "seyfarth-help-v1") throw new Error("help-content.version ist ungültig.")
  assertString(value.updatedAt, "help-content.updatedAt", 10)
  if (!DATE_PATTERN.test(String(value.updatedAt))) throw new Error("help-content.updatedAt muss YYYY-MM-DD sein.")

  if (!isRecord(value.hero)) throw new Error("help-content.hero muss ein Objekt sein.")
  assertExactKeys(value.hero, ["title", "intro", "tldr"], "help-content.hero")
  assertString(value.hero.title, "help-content.hero.title", TITLE_LIMIT)
  assertString(value.hero.intro, "help-content.hero.intro")
  assertString(value.hero.tldr, "help-content.hero.tldr")

  if (!Array.isArray(value.topics) || value.topics.length < 3 || value.topics.length > 40) throw new Error("help-content.topics muss 3 bis 40 Einträge enthalten.")
  const seenSlugs = new Set<string>()
  const topics: HelpTopic[] = value.topics.map((topic, index) => {
    const path = `help-content.topics[${index}]`
    if (!isRecord(topic)) throw new Error(`${path} muss ein Objekt sein.`)
    assertExactKeys(topic, ["slug", "title", "summary", "blocks"], path)
    assertString(topic.slug, `${path}.slug`, 80)
    const slug = String(topic.slug).trim()
    if (!SLUG_PATTERN.test(slug)) throw new Error(`${path}.slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.`)
    if (seenSlugs.has(slug)) throw new Error(`${path}.slug ist doppelt.`)
    seenSlugs.add(slug)
    assertString(topic.title, `${path}.title`, TITLE_LIMIT)
    assertString(topic.summary, `${path}.summary`)
    if (!Array.isArray(topic.blocks) || topic.blocks.length === 0 || topic.blocks.length > 12) throw new Error(`${path}.blocks muss eine Liste sein.`)
    return {
      slug,
      title: String(topic.title).trim(),
      summary: String(topic.summary).trim(),
      blocks: topic.blocks.map((block, blockIndex) => validateBlock(block, `${path}.blocks[${blockIndex}]`)),
    }
  })

  if (!Array.isArray(value.noticeLinks) || value.noticeLinks.length === 0 || value.noticeLinks.length > 8) throw new Error("help-content.noticeLinks muss eine Liste sein.")
  const noticeLinks = value.noticeLinks.map((link, index) => {
    const path = `help-content.noticeLinks[${index}]`
    if (!isRecord(link)) throw new Error(`${path} muss ein Objekt sein.`)
    assertExactKeys(link, ["slug", "label"], path)
    assertString(link.slug, `${path}.slug`, 80)
    assertString(link.label, `${path}.label`, 120)
    const slug = String(link.slug).trim()
    if (!seenSlugs.has(slug)) throw new Error(`${path}.slug verweist auf kein Hilfethema.`)
    return { slug, label: String(link.label).trim() }
  })

  if (!Array.isArray(value.faqs) || value.faqs.length < 8 || value.faqs.length > 30) throw new Error("help-content.faqs muss 8 bis 30 Fragen enthalten.")
  const faqs = value.faqs.map((faq, index) => {
    const path = `help-content.faqs[${index}]`
    if (!isRecord(faq)) throw new Error(`${path} muss ein Objekt sein.`)
    assertExactKeys(faq, ["question", "answer"], path)
    assertString(faq.question, `${path}.question`, 180)
    assertString(faq.answer, `${path}.answer`, 700)
    return { question: String(faq.question).trim(), answer: String(faq.answer).trim() }
  })

  return {
    version: "seyfarth-help-v1",
    updatedAt: String(value.updatedAt),
    hero: {
      title: String(value.hero.title).trim(),
      intro: String(value.hero.intro).trim(),
      tldr: String(value.hero.tldr).trim(),
    },
    noticeLinks,
    topics,
    faqs,
  }
}

export function getHelpContentPath() {
  return "./content/help-content.json"
}

export function getHelpContent(): HelpContent {
  const contentPath = getHelpContentPath()
  if (!existsSync(contentPath)) {
    throw new Error(`Pflegbarer Hilfe-Content fehlt: ${contentPath}`)
  }
  const parsed = JSON.parse(readFileSync(contentPath, "utf8"))
  return validateHelpContentJson(parsed)
}

export function saveHelpContent(content: HelpContent) {
  const contentPath = getHelpContentPath()
  const validated = validateHelpContentJson(content)
  writeFileSync(contentPath, `${JSON.stringify(validated, null, 2)}\n`, "utf8")
  return validated
}

export function getTopicBySlug(slug: string) {
  return getHelpContent().topics.find((topic) => topic.slug === slug) ?? null
}
