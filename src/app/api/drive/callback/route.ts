import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { saveConnection, DRIVE_SCOPE } from '@/lib/drive/connection';
import { STATE_COOKIE } from '../connect/route';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

const sameState = (a: string, b: string) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
};

/** Decode the id_token payload for the account's email. No verification needed: */
/* it arrived over TLS directly from Google's token endpoint, and it is used   */
/* only for display — never for authorization, which is always auth.uid().     */
const readIdToken = (idToken?: string): { sub?: string; email?: string } => {
  if (!idToken) return {};
  try {
    const payload = idToken.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return {};
  }
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const forwardedHost = request.headers.get('x-forwarded-host');
  const base =
    process.env.NODE_ENV === 'development' || !forwardedHost
      ? origin
      : `https://${forwardedHost}`;

  const settingsWith = (params: string) =>
    NextResponse.redirect(`${base}/settings?${params}`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${base}/login`);

  // Google bounces back with an error instead of a code when the user cancels.
  const oauthError = searchParams.get('error');
  if (oauthError) {
    return settingsWith(`drive=cancelled`);
  }

  const store = await cookies();
  const expected = store.get(STATE_COOKIE)?.value;
  const received = searchParams.get('state');

  // Single-use: clear it before doing anything else, so a replayed callback
  // cannot reuse the same state.
  store.delete(STATE_COOKIE);

  if (!expected || !received || !sameState(expected, received)) {
    return settingsWith('drive=badstate');
  }

  const code = searchParams.get('code');
  if (!code) return settingsWith('drive=failed');

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_DRIVE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET ?? '',
      redirect_uri: `${base}/api/drive/callback`,
      grant_type: 'authorization_code',
    }),
  });

  const body = (await res.json().catch(() => null)) as {
    refresh_token?: string;
    id_token?: string;
    scope?: string;
  } | null;

  if (!res.ok || !body?.refresh_token) {
    // No refresh token means prompt=consent did not take effect, or the code
    // was already redeemed. Either way there is nothing durable to store.
    console.error('[drive:callback] no refresh token returned');
    return settingsWith('drive=failed');
  }

  // Google may grant fewer scopes than asked. Storing what was actually
  // granted lets settings show a stale-scope warning instead of surfacing it
  // as a mystery 403 on the user's first import.
  const grantedScope = body.scope ?? DRIVE_SCOPE;

  try {
    const claims = readIdToken(body.id_token);
    await saveConnection(supabase, user.id, body.refresh_token, grantedScope, {
      sub: claims.sub,
      email: claims.email,
    });
  } catch {
    return settingsWith('drive=failed');
  }

  return settingsWith('drive=connected');
}
