import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const nginxConfig = readFileSync(new URL("../../nginx.seyfarth.conf", import.meta.url), "utf8")
const cspLine = nginxConfig.split("\n").find((line) => line.includes("Content-Security-Policy")) ?? ""

test("CSP allows Cloudflare Insights script without opening script-src broadly", () => {
  assert.match(cspLine, /script-src[^;]*https:\/\/static\.cloudflareinsights\.com/)
  assert.doesNotMatch(cspLine, /script-src[^;]*\*/)
})

test("nginx blocks exact legacy embed route", () => {
  assert.match(nginxConfig, /location = \/embed \{ return 404; \}/)
})
