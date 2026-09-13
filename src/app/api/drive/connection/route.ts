import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteConnection, getConnection } from '@/lib/drive/connection';
import { DriveError, logDriveError, refreshAccessToken } from '@/lib/drive/api';
import { loadRefreshToken } from '@/lib/drive/connection';

/** Connection status, for the settings page and the Picker button. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const connection = await getConnection(supabase);
  return NextResponse.json({ connection });
}

/** Disconnect. */
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await deleteConnection(supabase);
  return NextResponse.json({ ok: true });
}

/**
 * A short-lived access token for the Picker, which runs in the browser and
 * cannot use the refresh token.
 *
 * POST rather than GET: this mints a credential, so it should never be
 * reachable by a cross-site image tag or prefetch. The token is drive.file
 * scoped and expires in an hour, so the worst it grants is access to files the
 * user has already picked with this app.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const refreshToken = await loadRefreshToken(supabase);
    const accessToken = await refreshAccessToken(refreshToken);
    return NextResponse.json({ accessToken });
  } catch (error) {
    logDriveError('picker-token', error);

    if (error instanceof DriveError && error.kind === 'auth') {
      await deleteConnection(supabase);
      return NextResponse.json(
        { error: 'Reconnect Google Drive.', reconnect: true },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Could not reach Google Drive.' }, { status: 502 });
  }
}
