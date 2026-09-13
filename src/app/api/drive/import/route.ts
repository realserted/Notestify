import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { extractText } from '@/lib/extract';
import { resolveDriveFormat } from '@/lib/drive/formats';
import {
  DriveError,
  fetchDriveFileBytes,
  logDriveError,
  refreshAccessToken,
} from '@/lib/drive/api';
import {
  deleteConnection,
  loadRefreshToken,
  recordRefreshFailure,
} from '@/lib/drive/connection';

export const runtime = 'nodejs';
// Higher than /api/extract's 60: a Drive fetch happens before extraction runs.
export const maxDuration = 120;

const schema = z.object({
  fileId: z.string().min(1).max(200),
  name: z.string().trim().min(1).max(300),
  mimeType: z.string().min(1).max(200),
});

/** HTTP status per failure kind. `forbidden` is 404 so it leaks nothing. */
const STATUS: Record<DriveError['kind'], number> = {
  auth: 409, // distinct, so the client can offer "reconnect"
  forbidden: 404,
  not_found: 404,
  too_large: 413,
  rate_limit: 503,
  unknown: 502,
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = await checkRateLimit(supabase, 'drive');
  if (!limit.allowed) return rateLimitResponse('drive', limit);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const { fileId, name, mimeType } = parsed.data;

  // Reject before spending a Drive call or a token refresh. The Picker is
  // filtered to these types already, but it is a client and cannot be trusted.
  const format = resolveDriveFormat(mimeType);
  if (!format) {
    return NextResponse.json(
      { error: 'That file type is not supported. Use a Doc, Slides, PDF, DOCX or PPTX.' },
      { status: 415 }
    );
  }

  try {
    const refreshToken = await loadRefreshToken(supabase);
    const accessToken = await refreshAccessToken(refreshToken);

    // With drive.file, Google itself refuses any file this user never picked
    // through our Picker — that check happens here, inside Google, using the
    // caller's own token. A file ID belonging to someone else fails as
    // `forbidden`, which deliberately does NOT delete the connection.
    const bytes = await fetchDriveFileBytes(accessToken, fileId, format);

    const text = await extractText(bytes, format.format);
    if (!text) {
      return NextResponse.json(
        { error: 'No text could be read from that file.' },
        { status: 422 }
      );
    }

    // Inserted server-side, unlike the browser-side insert on /uploads: there
    // is no storage upload to pair it with, and the extracted text has to be
    // written by whoever fetched the bytes.
    const { data: doc, error } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        title: name,
        storage_path: null,
        file_size: bytes.byteLength,
        // The ORIGINAL Drive type, not the exported one, so a Google Doc can
        // never later be mistaken for a PDF by a mime_type check.
        mime_type: mimeType,
        extracted_text: text,
        status: 'ready',
        source: 'drive',
        drive_file_id: fileId,
      })
      .select()
      .single();

    if (error || !doc) {
      console.error('[drive:import] insert failed');
      return NextResponse.json({ error: 'Could not save that document.' }, { status: 500 });
    }

    return NextResponse.json({ document: doc });
  } catch (error) {
    logDriveError('import', error);

    if (error instanceof DriveError) {
      // Only a dead grant clears the connection. A `forbidden` here means the
      // token is healthy and the claim to that one file is not — disconnecting
      // would log the user out of Drive for poking at a file ID.
      if (error.kind === 'auth') {
        await recordRefreshFailure(supabase, 'invalid_grant').catch(() => {});
        await deleteConnection(supabase);
      }

      return NextResponse.json(
        { error: error.message, reconnect: error.kind === 'auth' },
        { status: STATUS[error.kind] }
      );
    }

    return NextResponse.json({ error: 'Could not import that file.' }, { status: 500 });
  }
}
