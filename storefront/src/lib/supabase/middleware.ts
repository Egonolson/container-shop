import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PROTECTED_PREFIXES = ["/konto", "/admin"]

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // do not run any logic between createServerClient and getUser() — it
  // refreshes the session token and must run on every request
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAdminLogin = request.nextUrl.pathname === "/admin/login"
  const isProtected =
    !isAdminLogin && PROTECTED_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix))

  if (isProtected && !user) {
    const redirectTarget = request.nextUrl.pathname.startsWith("/admin") ? "/admin/login" : "/login"
    const url = request.nextUrl.clone()
    url.pathname = redirectTarget
    url.searchParams.set("next", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
