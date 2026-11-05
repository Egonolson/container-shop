import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { it } from "node:test"
import { compile } from "@tailwindcss/node"
import postcss from "postcss"

// Captured from the installed shadcn 3.8.5 import before CLI removal.
// Compare compiled CSS semantics; ignore formatting, comments and source locations.
const baseline = JSON.parse(readFileSync(new URL("./fixtures/shadcn-tailwind-3.8.5-parity.json", import.meta.url), "utf8"))

function normalized(node) {
  if (node.type === "comment") return null
  if (node.type === "decl") return { type: node.type, prop: node.prop, value: node.value, important: !!node.important }
  return {
    type: node.type,
    ...(node.type === "rule" ? { selector: node.selector } : {}),
    ...(node.type === "atrule" ? { name: node.name, params: node.params } : {}),
    ...(node.nodes ? { nodes: node.nodes.map(normalized).filter(Boolean) } : {}),
  }
}

for (const { candidate, sha256 } of baseline.cases) {
  it(`preserves the compiled ${candidate} stylesheet after CLI ejection`, async () => {
    const source = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8")
      .replace('@import "tailwindcss";', '@import "tailwindcss" source(none);')
    const compiler = await compile(source, { base: process.cwd(), onDependency() {} })
    const ast = postcss.parse(compiler.build([candidate]))
    let found = false
    ast.walkRules(rule => {
      if (rule.selector === `.${candidate.replace(":", "\\:")}`) found = true
    })
    assert.ok(found, `${candidate} emits an actual CSS rule`)
    const digest = createHash("sha256").update(JSON.stringify(normalized(ast))).digest("hex")
    assert.equal(digest, sha256, `${candidate} keeps the complete compiled stylesheet semantics`)
  })
}
