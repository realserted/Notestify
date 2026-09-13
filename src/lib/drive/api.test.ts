import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DriveError, fetchDriveFileBytes, refreshAccessToken } from './api';
import { DOCX_MIME } from './formats';

const DOWNLOAD = { exportAs: null, format: 'pdf' } as const;
const EXPORT = { exportAs: DOCX_MIME, format: 'docx' } as const;

const googleError = (status: number, reason?: string) =>
  new Response(JSON.stringify({ error: { errors: reason ? [{ reason }] : [] } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Assert an async call rejects with a DriveError of a specific kind. */
const expectKind = async (fn: () => Promise<unknown>, kind: DriveError['kind']) => {
  await expect(fn()).rejects.toMatchObject({ name: 'DriveError', kind });
};

beforeEach(() => {
  process.env.GOOGLE_DRIVE_CLIENT_ID = 'test-client';
  process.env.GOOGLE_DRIVE_CLIENT_SECRET = 'test-secret';
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('refreshAccessToken', () => {
  it('returns the access token', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ access_token: 'ya29.abc' }));
    expect(await refreshAccessToken('refresh')).toBe('ya29.abc');
  });

  it('maps invalid_grant to auth, so the caller clears the connection', async () => {
    // invalid_grant covers revoked access, a password change, and the 7-day
    // expiry that applies while the consent screen is in Testing. None are
    // recoverable without fresh consent, so retrying is pointless.
    vi.stubGlobal('fetch', async () =>
      Response.json({ error: 'invalid_grant' }, { status: 400 })
    );
    await expectKind(() => refreshAccessToken('dead'), 'auth');
  });

  it('does not treat a transient Google outage as a dead grant', async () => {
    // A 500 from Google must NOT delete the user's connection.
    vi.stubGlobal('fetch', async () => Response.json({ error: 'backend_error' }, { status: 500 }));
    await expectKind(() => refreshAccessToken('fine'), 'unknown');
  });

  it('fails when Google returns 200 with no token', async () => {
    vi.stubGlobal('fetch', async () => Response.json({}));
    await expectKind(() => refreshAccessToken('fine'), 'unknown');
  });
});

describe('fetchDriveFileBytes error mapping', () => {
  it('maps a bare 403 to forbidden, NOT auth', async () => {
    // The security-critical case. With drive.file, Google returns 403 for a
    // file the user never picked. If this mapped to `auth`, submitting someone
    // else's file ID would delete the victim's own Drive connection.
    vi.stubGlobal('fetch', async () => googleError(403));
    await expectKind(() => fetchDriveFileBytes('tok', 'id', DOWNLOAD), 'forbidden');
  });

  it('maps 401 to auth', async () => {
    vi.stubGlobal('fetch', async () => googleError(401));
    await expectKind(() => fetchDriveFileBytes('tok', 'id', DOWNLOAD), 'auth');
  });

  it('maps 404 to not_found', async () => {
    // File deleted between the pick and the fetch.
    vi.stubGlobal('fetch', async () => googleError(404));
    await expectKind(() => fetchDriveFileBytes('tok', 'id', DOWNLOAD), 'not_found');
  });

  it('maps a rate-limited 403 to rate_limit, not forbidden', async () => {
    vi.stubGlobal('fetch', async () => googleError(403, 'userRateLimitExceeded'));
    await expectKind(() => fetchDriveFileBytes('tok', 'id', DOWNLOAD), 'rate_limit');
  });

  it('maps 429 to rate_limit', async () => {
    vi.stubGlobal('fetch', async () => googleError(429));
    await expectKind(() => fetchDriveFileBytes('tok', 'id', DOWNLOAD), 'rate_limit');
  });

  it('maps an export size failure to too_large', async () => {
    vi.stubGlobal('fetch', async () => googleError(403, 'exportSizeLimitExceeded'));
    await expectKind(() => fetchDriveFileBytes('tok', 'id', EXPORT), 'too_large');
  });
});

describe('fetchDriveFileBytes request shape', () => {
  it('exports native formats and downloads the rest', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(url);
      return new Response(Buffer.from('hello'));
    });

    await fetchDriveFileBytes('tok', 'file-1', EXPORT);
    expect(calls[0]).toContain('/export?mimeType=');
    expect(calls[0]).toContain(encodeURIComponent(DOCX_MIME));

    await fetchDriveFileBytes('tok', 'file-1', DOWNLOAD);
    expect(calls[1]).toContain('alt=media');
    expect(calls[1]).not.toContain('/export');
  });

  it('encodes the file id rather than interpolating it raw', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(url);
      return new Response(Buffer.from('x'));
    });

    await fetchDriveFileBytes('tok', 'a/../b?x=1', DOWNLOAD);
    expect(calls[0]).not.toContain('../');
    expect(calls[0]).toContain(encodeURIComponent('a/../b?x=1'));
  });

  it('returns the body as a Buffer', async () => {
    vi.stubGlobal('fetch', async () => new Response(Buffer.from('file-bytes')));
    const out = await fetchDriveFileBytes('tok', 'id', DOWNLOAD);
    expect(out.toString('utf8')).toBe('file-bytes');
  });
});

describe('size ceiling', () => {
  it('rejects on a Content-Length above the ceiling', async () => {
    // Only the rejection is asserted. Whether the stream is touched is not
    // ours to control — the Response constructor may pull from it before our
    // code runs — so asserting on that would test the platform, not this code.
    // The no-buffering property is covered by the mid-stream test below.
    vi.stubGlobal('fetch', async () =>
      new Response(new Uint8Array(8), {
        headers: { 'content-length': String(50 * 1024 * 1024) },
      })
    );

    await expectKind(() => fetchDriveFileBytes('tok', 'id', DOWNLOAD), 'too_large');
  });

  it('rejects mid-stream when no Content-Length is sent', async () => {
    // Drive exports are frequently chunked and send no length at all, so the
    // running total is the real guard. Without it the cap would only be
    // checked after buffering the whole file, which defeats the point.
    const chunk = new Uint8Array(1024 * 1024);
    let emitted = 0;

    vi.stubGlobal('fetch', async () => {
      const stream = new ReadableStream({
        pull(controller) {
          emitted += 1;
          if (emitted > 200) return controller.close();
          controller.enqueue(chunk);
        },
      });
      return new Response(stream);
    });

    await expectKind(() => fetchDriveFileBytes('tok', 'id', DOWNLOAD), 'too_large');
    // 15 MB cap, so it must give up long before the 200 MB the stream offers.
    expect(emitted).toBeLessThan(40);
  });

  it('accepts a file under the ceiling', async () => {
    vi.stubGlobal('fetch', async () => new Response(new Uint8Array(1024)));
    const out = await fetchDriveFileBytes('tok', 'id', DOWNLOAD);
    expect(out.byteLength).toBe(1024);
  });
});
