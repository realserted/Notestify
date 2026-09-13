import { MAX_DRIVE_EXPORT_BYTES, MAX_UPLOAD_BYTES, formatBytes } from '@/lib/limits';
import type { DriveFormat } from './formats';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FILES_URL = 'https://www.googleapis.com/drive/v3/files';

/**
 * Drive failures the caller must treat differently.
 *
 * The distinction that matters most is `auth` vs `forbidden`. `auth` means the
 * grant itself is dead, so the connection row should be deleted and the user
 * asked to reconnect. `forbidden` means this token is fine but was never
 * granted THIS file — deleting the connection there would log a user out of
 * Drive because they poked at a file ID they had no claim to.
 */
export type DriveErrorKind =
  | 'auth'
  | 'forbidden'
  | 'not_found'
  | 'too_large'
  | 'rate_limit'
  | 'unknown';

export class DriveError extends Error {
  constructor(
    readonly kind: DriveErrorKind,
    message: string
  ) {
    super(message);
    this.name = 'DriveError';
  }
}

/**
 * Google's error objects carry the request URL — which contains the file ID —
 * and frequently a response body with file metadata. Never log the object.
 */
export const logDriveError = (scope: string, error: unknown) => {
  const kind = error instanceof DriveError ? error.kind : 'unknown';
  console.error(`[drive:${scope}] ${kind}`);
};

const env = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new DriveError('unknown', `${name} is not set`);
  return value;
};

/**
 * Exchange a refresh token for a short-lived access token.
 *
 * Called on every import rather than caching: an access token lives an hour,
 * caching it across serverless invocations needs shared state we do not have,
 * and a refresh is one fast request.
 */
export const refreshAccessToken = async (refreshToken: string): Promise<string> => {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env('GOOGLE_DRIVE_CLIENT_ID'),
      client_secret: env('GOOGLE_DRIVE_CLIENT_SECRET'),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const body = (await res.json().catch(() => null)) as {
    access_token?: string;
    error?: string;
  } | null;

  if (!res.ok) {
    // invalid_grant covers revoked access, a password change, and the 7-day
    // expiry that applies while the OAuth consent screen is in Testing. None
    // are recoverable without fresh consent, so retrying is pointless.
    if (body?.error === 'invalid_grant') {
      throw new DriveError('auth', 'Your Google Drive connection has expired.');
    }
    throw new DriveError('unknown', 'Could not refresh Google Drive access.');
  }

  if (!body?.access_token) {
    throw new DriveError('unknown', 'Google returned no access token.');
  }

  return body.access_token;
};

/**
 * Read a response body while enforcing a ceiling.
 *
 * Content-Length alone is not enough — Drive exports are frequently chunked
 * and send no length at all — so the running total is the real guard. Without
 * it, "reject files that are too large" would mean buffering the whole file
 * first and checking afterwards, which is the thing the limit exists to avoid.
 */
const readCapped = async (res: Response, maxBytes: number): Promise<Buffer> => {
  const declared = Number(res.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new DriveError('too_large', `That file is larger than ${formatBytes(maxBytes)}.`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new DriveError('unknown', 'Drive returned an empty response.');

  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new DriveError('too_large', `That file is larger than ${formatBytes(maxBytes)}.`);
    }

    chunks.push(value);
  }

  return Buffer.concat(chunks);
};

const failureFor = async (res: Response): Promise<DriveError> => {
  const detail = (await res.json().catch(() => null)) as {
    error?: { errors?: Array<{ reason?: string }>; message?: string };
  } | null;
  const reason = detail?.error?.errors?.[0]?.reason ?? '';

  if (res.status === 404) {
    return new DriveError('not_found', 'That file is no longer available in Drive.');
  }
  if (res.status === 401) {
    return new DriveError('auth', 'Your Google Drive connection has expired.');
  }
  if (res.status === 429 || /rateLimitExceeded/i.test(reason)) {
    return new DriveError('rate_limit', 'Google Drive is busy. Try again in a moment.');
  }
  if (/exportSizeLimitExceeded/i.test(reason)) {
    return new DriveError(
      'too_large',
      `Google can only export documents up to ${formatBytes(MAX_DRIVE_EXPORT_BYTES)}.`
    );
  }
  if (res.status === 403) {
    // With drive.file, this is what Google returns for a file the user never
    // picked through our Picker. The token is healthy; the claim to the file
    // is not.
    return new DriveError('forbidden', 'Notestify does not have access to that file.');
  }

  return new DriveError('unknown', 'Could not read that file from Drive.');
};

/** Fetch a file's bytes, exporting native Google formats and downloading the rest. */
export const fetchDriveFileBytes = async (
  accessToken: string,
  fileId: string,
  format: DriveFormat
): Promise<Buffer> => {
  const id = encodeURIComponent(fileId);

  const url = format.exportAs
    ? `${FILES_URL}/${id}/export?mimeType=${encodeURIComponent(format.exportAs)}`
    : `${FILES_URL}/${id}?alt=media`;

  // Google's export ceiling is lower than our upload ceiling, and applies only
  // to the export path.
  const cap = format.exportAs ? MAX_DRIVE_EXPORT_BYTES : MAX_UPLOAD_BYTES;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw await failureFor(res);

  return readCapped(res, cap);
};
