import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

// AES-256-GCM at-rest encryption for secrets stored in the DB (the SMTP
// password). The key is derived from the server-only SUPABASE_SERVICE_KEY, so
// the ciphertext is useless without server access. Format: base64(iv|tag|ct).

function key(): Buffer {
  const material = process.env.SUPABASE_SERVICE_KEY
  if (!material) throw new Error("SUPABASE_SERVICE_KEY not configured for encryption")
  return createHash("sha256").update(material).digest()
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), iv)
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, ct]).toString("base64")
}

export function decryptSecret(payload: string): string {
  const raw = Buffer.from(payload, "base64")
  const iv = raw.subarray(0, 12)
  const tag = raw.subarray(12, 28)
  const ct = raw.subarray(28)
  const decipher = createDecipheriv("aes-256-gcm", key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8")
}
