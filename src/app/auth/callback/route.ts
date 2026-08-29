import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Only allow same-origin relative paths, so ?next= can't be used as an open redirect.
const safeNext = (value: string | null) =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get('next'));

  const loginWithError = (message: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);

  // Google can bounce back with an error instead of a code (user hit "Cancel", etc).
  const oauthError = searchParams.get('error_description') ?? searchParams.get('error');
  if (oauthError) return loginWithError(oauthError);

  const code = searchParams.get('code');
  if (!code) return loginWithError('No authorization code was returned. Please try again.');

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return loginWithError(error.message);

  // Behind Vercel's proxy `origin` is the internal host, so prefer the forwarded one.
  const forwardedHost = request.headers.get('x-forwarded-host');
  const base =
    process.env.NODE_ENV === 'development' || !forwardedHost
      ? origin
      : `https://${forwardedHost}`;

  return NextResponse.redirect(`${base}${next}`);
}
