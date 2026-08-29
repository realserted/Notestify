import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/decks',
  '/documents',
  '/notes',
  '/quizzes',
  '/settings',
  '/uploads',
  '/tutor',
];

// Vercel kills a middleware invocation at ~25s. Bail out well before that so a
// slow or unreachable Supabase never turns into MIDDLEWARE_INVOCATION_TIMEOUT.
const AUTH_TIMEOUT_MS = 3000;

export const updateSession = async (request: NextRequest) => {
  let response = NextResponse.next({ request });

  const url = request.nextUrl.clone();
  const isAuthRoute = url.pathname.startsWith('/login') || url.pathname.startsWith('/register');
  const isProtected = PROTECTED_PREFIXES.some((p) => url.pathname.startsWith(p));

  // Every other path is public and needs no session round-trip.
  if (!isAuthRoute && !isProtected) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  let authFailed = false;

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('auth timeout')), AUTH_TIMEOUT_MS)
    );
    const result = await Promise.race([supabase.auth.getUser(), timeout]);
    user = result.data.user;
  } catch {
    authFailed = true;
  }

  if (authFailed) {
    // Couldn't confirm a session. Let auth pages through; send protected pages
    // to /login rather than rendering an unguarded shell.
    if (isAuthRoute) return response;
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (!user && isProtected) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  if (user && isAuthRoute) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
};
