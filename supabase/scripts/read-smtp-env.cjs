// Reads the admin-managed SMTP settings, decrypts the password, and prints
// them as SMTP_*=value lines. Runs INSIDE the seyfarth-storefront container
// (piped via stdin) so it has SUPABASE_SERVICE_KEY and can reach Kong
// internally. Built-ins only (no app imports) so it works in the standalone
// runtime image. Decrypt must mirror src/lib/crypto.ts.
const crypto = require("node:crypto")

const serviceKey = process.env.SUPABASE_SERVICE_KEY
if (!serviceKey) {
  console.error("SUPABASE_SERVICE_KEY not set in container")
  process.exit(1)
}

function decrypt(payload) {
  const raw = Buffer.from(payload, "base64")
  const iv = raw.subarray(0, 12)
  const tag = raw.subarray(12, 28)
  const ct = raw.subarray(28)
  const key = crypto.createHash("sha256").update(serviceKey).digest()
  const d = crypto.createDecipheriv("aes-256-gcm", key, iv)
  d.setAuthTag(tag)
  return Buffer.concat([d.update(ct), d.final()]).toString("utf8")
}

;(async () => {
  const res = await fetch(
    "http://seyfarth-kong:8000/rest/v1/app_smtp_settings?id=eq.1&select=host,port,secure,username,password_cipher,from_email,from_name",
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
  )
  if (!res.ok) throw new Error(`REST ${res.status}`)
  const rows = await res.json()
  const s = rows[0] || {}
  const pass = s.password_cipher ? decrypt(s.password_cipher) : ""
  const out = {
    SMTP_HOST: s.host || "",
    SMTP_PORT: s.port || 587,
    SMTP_USER: s.username || "",
    SMTP_PASS: pass,
    SMTP_FROM: s.from_email || "",
    SMTP_FROM_NAME: s.from_name || "",
  }
  for (const [k, v] of Object.entries(out)) console.log(`${k}=${v}`)
})().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
