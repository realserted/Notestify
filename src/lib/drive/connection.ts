import type { SupabaseClient } from '@supabase/supabase-js';
import { sealToken, openToken } from './crypto';
import { DriveError } from './api';

/**
 * Reading and writing the one drive_connections row a user may have.
 *
 * Every function here takes the CALLER'S Supabase client, never the service
 * role. Postgres then enforces ownership through RLS even if a route's logic
 * is wrong, which is the invariant CLAUDE.md asks for.
 */

const TABLE = 'drive_connections';

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export interface DriveConnectionSummary {
  googleEmail: string | null;
  connectedAt: string;
  /** True when the stored grant predates a change to DRIVE_SCOPE. */
  scopeStale: boolean;
}

export const saveConnection = async (
  supabase: SupabaseClient,
  userId: string,
  refreshToken: string,
  scope: string,
  google: { sub?: string | null; email?: string | null }
): Promise<void> => {
  const sealed = sealToken(refreshToken);

  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      refresh_token_ciphertext: sealed.ciphertext,
      iv: sealed.iv,
      auth_tag: sealed.authTag,
      scope,
      google_sub: google.sub ?? null,
      google_email: google.email ?? null,
      connected_at: new Date().toISOString(),
      last_refresh_error: null,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    // The row, not the token — but be conservative and log neither.
    console.error('[drive:save] upsert failed');
    throw new DriveError('unknown', 'Could not save your Drive connection.');
  }
};

/** Null when the user has never connected, so callers can offer to connect. */
export const getConnection = async (
  supabase: SupabaseClient
): Promise<DriveConnectionSummary | null> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('google_email, connected_at, scope')
    .maybeSingle();

  if (error || !data) return null;

  return {
    googleEmail: data.google_email,
    connectedAt: data.connected_at,
    scopeStale: data.scope !== DRIVE_SCOPE,
  };
};

/**
 * Decrypt the stored refresh token.
 *
 * Throws `auth` when there is no connection, so the import route can answer
 * "reconnect" identically whether the row is missing or the grant is dead —
 * the user's next action is the same either way.
 */
export const loadRefreshToken = async (supabase: SupabaseClient): Promise<string> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('refresh_token_ciphertext, iv, auth_tag')
    .maybeSingle();

  if (error || !data) {
    throw new DriveError('auth', 'Connect Google Drive first.');
  }

  try {
    return openToken({
      ciphertext: data.refresh_token_ciphertext,
      iv: data.iv,
      authTag: data.auth_tag,
    });
  } catch {
    // Wrong key, or a tampered row. Either way the stored token is unusable
    // and the only route forward is a fresh consent.
    console.error('[drive:load] token failed to decrypt');
    throw new DriveError('auth', 'Your Drive connection could not be read. Reconnect it.');
  }
};

export const deleteConnection = async (supabase: SupabaseClient): Promise<void> => {
  // RLS scopes this to the caller's own row, so no filter is needed — and
  // adding a wrong one would be more dangerous than omitting it.
  const { error } = await supabase.from(TABLE).delete().not('user_id', 'is', null);
  if (error) console.error('[drive:delete] failed');
};

/** Record why a refresh failed, for diagnosis. Never stores the token. */
export const recordRefreshFailure = async (
  supabase: SupabaseClient,
  reason: string
): Promise<void> => {
  await supabase.from(TABLE).update({ last_refresh_error: reason }).not('user_id', 'is', null);
};
