import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // Public routes — never redirect
  const publicRoutes = ['/', '/login', '/signup', '/register', '/offline', '/auth'];
  const isPublic = 
    publicRoutes.some(r => pathname === r || pathname.startsWith('/auth')) ||
    pathname.startsWith('/listings') ||
    pathname.startsWith('/api/listings');
  if (isPublic) {
    return supabaseResponse;
  }

  // No session → login
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role, onboarded')
    .eq('id', user.id)
    .single();

  // No profile or no name → register first
  if (!profile?.name && pathname !== '/register') {
    return NextResponse.redirect(new URL('/register', request.url));
  }

  // Not onboarded → onboard
  if (profile?.name && !profile?.onboarded && pathname !== '/onboard') {
    return NextResponse.redirect(new URL('/onboard', request.url));
  }

  // Role-based guards
  if (profile?.role === 'landlord' && pathname.startsWith('/tenant')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (profile?.role === 'tenant' && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/tenant', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)',
  ],
};
