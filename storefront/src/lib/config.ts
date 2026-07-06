// Client-visible feature flags (inlined at build time via NEXT_PUBLIC_*).

// Whether customers can create accounts. Disabled on environments without a
// working transactional SMTP setup (e.g. PROD until real credentials exist):
// account creation needs email confirmation, and forcing an account on
// business customers would otherwise block their inquiry entirely. When off,
// everyone submits as a guest and the registration UI is hidden.
export const REGISTRATION_ENABLED = process.env.NEXT_PUBLIC_REGISTRATION_ENABLED !== "false"
