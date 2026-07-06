import { PublicShell } from "@/components/public/public-shell"
import { LoginForm } from "./login-form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  return (
    <PublicShell>
      <LoginForm next={next ?? "/konto"} />
    </PublicShell>
  )
}
