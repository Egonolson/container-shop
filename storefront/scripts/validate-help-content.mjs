#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const path = process.env.SEYFARTH_HELP_CONTENT_PATH || join(root, 'content', 'help-content.json')
const content = JSON.parse(readFileSync(path, 'utf8'))

const allowedTop = new Set(['version', 'updatedAt', 'hero', 'noticeLinks', 'topics', 'faqs'])
const allowedTopic = new Set(['slug', 'title', 'summary', 'blocks'])
const allowedParagraph = new Set(['type', 'text'])
const allowedList = new Set(['type', 'items'])
const allowedFaq = new Set(['question', 'answer'])
const allowedNoticeLink = new Set(['slug', 'label'])
const slugPattern = /^[a-z0-9-]+$/

function fail(message) {
  console.error(`FAIL ${message}`)
  process.exit(1)
}

function assertRecord(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} muss ein Objekt sein.`)
}

function assertKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(`${label}.${key} ist nicht erlaubt.`)
  }
}

function assertText(value, label, max = 1200) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > max) {
    fail(`${label} muss ein nicht leerer Text mit maximal ${max} Zeichen sein.`)
  }
}

assertRecord(content, 'help-content')
assertKeys(content, allowedTop, 'help-content')
if (content.version !== 'seyfarth-help-v1') fail('version ist ungültig.')
if (!/^\d{4}-\d{2}-\d{2}$/.test(content.updatedAt || '')) fail('updatedAt muss YYYY-MM-DD sein.')
assertRecord(content.hero, 'hero')
assertText(content.hero.title, 'hero.title', 140)
assertText(content.hero.intro, 'hero.intro')
assertText(content.hero.tldr, 'hero.tldr')

if (!Array.isArray(content.topics) || content.topics.length < 3 || content.topics.length > 40) fail('topics muss 3 bis 40 Einträge enthalten.')
const slugs = new Set()
for (const [index, topic] of content.topics.entries()) {
  const label = `topics[${index}]`
  assertRecord(topic, label)
  assertKeys(topic, allowedTopic, label)
  assertText(topic.slug, `${label}.slug`, 80)
  if (!slugPattern.test(topic.slug)) fail(`${label}.slug ist ungültig.`)
  if (slugs.has(topic.slug)) fail(`${label}.slug ist doppelt.`)
  slugs.add(topic.slug)
  assertText(topic.title, `${label}.title`, 140)
  assertText(topic.summary, `${label}.summary`)
  if (!Array.isArray(topic.blocks) || topic.blocks.length === 0 || topic.blocks.length > 12) fail(`${label}.blocks ist ungültig.`)
  for (const [blockIndex, block] of topic.blocks.entries()) {
    const blockLabel = `${label}.blocks[${blockIndex}]`
    assertRecord(block, blockLabel)
    if (block.type === 'paragraph') {
      assertKeys(block, allowedParagraph, blockLabel)
      assertText(block.text, `${blockLabel}.text`)
    } else if (block.type === 'list') {
      assertKeys(block, allowedList, blockLabel)
      if (!Array.isArray(block.items) || block.items.length === 0 || block.items.length > 12) fail(`${blockLabel}.items ist ungültig.`)
      block.items.forEach((item, itemIndex) => assertText(item, `${blockLabel}.items[${itemIndex}]`, 220))
    } else {
      fail(`${blockLabel}.type ist ungültig.`)
    }
  }
}

if (!Array.isArray(content.noticeLinks) || content.noticeLinks.length === 0 || content.noticeLinks.length > 8) fail('noticeLinks ist ungültig.')
for (const [index, link] of content.noticeLinks.entries()) {
  const label = `noticeLinks[${index}]`
  assertRecord(link, label)
  assertKeys(link, allowedNoticeLink, label)
  assertText(link.slug, `${label}.slug`, 80)
  assertText(link.label, `${label}.label`, 120)
  if (!slugs.has(link.slug)) fail(`${label}.slug verweist auf kein Hilfethema.`)
}

if (!Array.isArray(content.faqs) || content.faqs.length < 8 || content.faqs.length > 30) fail('faqs muss 8 bis 30 Fragen enthalten.')
for (const [index, faq] of content.faqs.entries()) {
  const label = `faqs[${index}]`
  assertRecord(faq, label)
  assertKeys(faq, allowedFaq, label)
  assertText(faq.question, `${label}.question`, 180)
  assertText(faq.answer, `${label}.answer`, 700)
}

for (const requiredSlug of ['gefaehrliche-stoffe', 'verpackung-befuellung', 'annahmebedingungen']) {
  if (!slugs.has(requiredSlug)) fail(`Pflichtthema fehlt: ${requiredSlug}`)
}

console.log(`PASS Hilfe-Content validiert: ${content.topics.length} Themen, ${content.faqs.length} FAQs.`)
