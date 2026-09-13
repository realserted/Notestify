import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { DRIVE_SCOPE } from '@/lib/drive/connection';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

export const STATE_COOKIE = 'drive_oauth_state';

/**
 * Start the Drive consent flow.
 *
 * Deliberately separate from Supabase's Google sign-in. Supabase surfaces
 * provider tokens only in the session at sign-in and never persists or
 * refreshes them, so piggybacking on it would force a Drive prompt on every
 * login, exclude email/password users, and lose the token after one redirect.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { origin } = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const base =
    process.env.NODE_ENV === 'development' || !forwardedHost
      ? origin
      : `https://${forwardedHost}`;

  // Login-CSRF guard. Without it, an attacker can get a victim to complete the
  // callback with the ATTACKER'S authorization code, silently linking the
  // attacker's Drive to the victim's Notestify account.
  const state = randomBytes(32).toString('base64url');
  const store = await cookies();
  store.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax', // must survive the redirect back from Google
    path: '/',
    maxAge: 600,
  });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_DRIVE_CLIENT_ID ?? '',
    redirect_uri: `${base}/api/drive/callback`,
    response_type: 'code',
    scope: DRIVE_SCOPE,
    // Both are required to get a refresh token at all. access_type alone
    // returns one only on the very first consent ever granted, so a user who
    // reconnects would get an access token that dies in an hour with no way
    // to renew it.
    access_type: 'offline',
    prompt: 'consent',
    // Deliberately NOT include_granted_scopes. It merges in every scope this
    // Google account already granted anywhere in the project — which here
    // means openid, email and profile from the Supabase sign-in client, since
    // both share one consent screen. The resulting token would reach further
    // than drive.file for no benefit.
    state,
  });

  return NextResponse.redirect(`${AUTH_URL}?${params}`);
}
