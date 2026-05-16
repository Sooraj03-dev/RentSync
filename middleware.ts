import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — required to keep session alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Public routes (no auth required) ──
  const publicPaths = ["/login", "/verify", "/offline", "/listings", "/register", "/"];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return supabaseResponse;
  }

  // ── No session → redirect to login ──
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Fetch user role ──
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarded")
    .eq("id", user.id)
    .single();

  const role = profile?.role as "landlord" | "tenant" | null;
  const onboarded = profile?.onboarded ?? false;

  // ── Not onboarded yet → redirect to onboard ──
  if (!onboarded && pathname !== "/onboard") {
    return NextResponse.redirect(new URL("/onboard", request.url));
  }

  // ── Role-based path guards ──
  if (role === "landlord" && pathname.startsWith("/tenant")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (role === "tenant" && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/tenant", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|api).*)",
  ],
};
