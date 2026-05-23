import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const source = readFileSync(new URL("../src/lib/seyfarth-request-store.ts", import.meta.url), "utf8")

test("runtime request log fallback avoids process.cwd Turbopack tracing", () => {
  assert.doesNotMatch(source, /process\.cwd\(\)/)
  assert.match(source, /join\(\"data\", \"shop-requests\.jsonl\"\)/)
})
