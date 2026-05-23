import { readFileSync } from "node:fs"

const header = readFileSync("src/components/public/header.tsx", "utf8")
const helpPage = readFileSync("src/app/hilfe/page.tsx", "utf8")
const helpSlugPage = readFileSync("src/app/hilfe/[slug]/page.tsx", "utf8")

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) {
    console.error(`FAIL ${label}: missing ${needle}`)
    process.exit(1)
  }
  console.log(`PASS ${label}`)
}

function assertRegex(source, pattern, label) {
  if (!pattern.test(source)) {
    console.error(`FAIL ${label}: ${pattern}`)
    process.exit(1)
  }
  console.log(`PASS ${label}`)
}

assertIncludes(header, "Container anfragen", "primary nav label")
assertIncludes(header, "Was darf rein?", "material guidance nav label")
assertIncludes(header, "Hilfe & Fragen", "help nav label")
assertIncludes(header, "Kontakt", "contact nav label")
assertIncludes(header, "/hilfe/bauschutt", "bauschutt subpage link")
assertIncludes(header, "/hilfe/baumischabfall", "baumischabfall subpage link")
assertIncludes(header, "/hilfe/gefaehrliche-stoffe", "hazard subpage link")
assertIncludes(header, "/hilfe/verpackung-befuellung", "filling subpage link")
assertIncludes(header, "/hilfe/oeffentliche-stellflaeche", "public placement subpage link")
assertIncludes(header, "/hilfe/annahmebedingungen", "acceptance conditions subpage link")
assertRegex(header, /tel:03449155200/, "phone link remains reachable")
assertIncludes(helpPage, "FAQPage", "help page keeps FAQ schema")
assertIncludes(helpSlugPage, "generateStaticParams", "help slug pages are generated")
assertIncludes(helpSlugPage, "notFound()", "unknown slugs do not crash")
