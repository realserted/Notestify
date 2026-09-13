import { test, expect } from '@playwright/test';

/**
 * The tests that actually earn their keep.
 *
 * Route gating lives in two lists that must agree — the matcher in
 * src/middleware.ts and PROTECTED_PREFIXES in src/lib/supabase/middleware.ts.
 * Adding a route to one and forgetting the other leaves it ungated, and
 * nothing in the type system or the build catches that. These do.
 */

const PROTECTED = [
  '/dashboard',
  '/decks',
  '/documents',
  '/notes',
  '/quizzes',
  '/search',
  '/settings',
  '/tutor',
  '/uploads',
];

test.describe('anonymous access', () => {
  for (const path of PROTECTED) {
    test(`${path} redirects to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  // Middleware gates /admin before the page runs, so an anonymous visitor is
  // redirected like any other private route. The notFound() in the page — 404
  // rather than 403, so a non-admin cannot confirm the route exists — only
  // applies to a signed-in user without the role, which needs an authenticated
  // fixture to cover.
  test('/admin redirects to /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('public pages load', async ({ page }) => {
    for (const path of ['/', '/about', '/privacy', '/terms']) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should be reachable`).toBe(200);
    }
  });
});

test.describe('API auth', () => {
  test('AI routes reject anonymous callers', async ({ request }) => {
    const res = await request.post('/api/ai/tutor', {
      data: { message: 'hello' },
    });
    expect(res.status()).toBe(401);
  });

  test('admin API does not reveal itself', async ({ request }) => {
    const res = await request.patch('/api/admin/feedback/00000000-0000-0000-0000-000000000000', {
      data: { status: 'done' },
    });
    // 401 unauthenticated, 404 authenticated-but-not-admin. Never 200.
    expect([401, 404]).toContain(res.status());
  });

  test('cron endpoint rejects callers without the secret', async ({ request }) => {
    const res = await request.get('/api/cron/reminders');
    // 404 when the secret is set, 503 when it is not configured. Never 200 —
    // a 200 here would mean anyone can trigger a send to every user.
    expect([404, 503]).toContain(res.status());
  });
});

test.describe('Google Drive', () => {
  test('import rejects anonymous callers', async ({ request }) => {
    const res = await request.post('/api/drive/import', {
      data: { fileId: 'abc', name: 'x.pdf', mimeType: 'application/pdf' },
    });
    expect(res.status()).toBe(401);
  });

  test('picker token is not mintable anonymously', async ({ request }) => {
    // This endpoint hands out a Google access token. A 200 here would mean
    // anyone can mint one.
    const res = await request.post('/api/drive/connection');
    expect(res.status()).toBe(401);
  });

  test('connection status and disconnect require a session', async ({ request }) => {
    expect((await request.get('/api/drive/connection')).status()).toBe(401);
    expect((await request.delete('/api/drive/connection')).status()).toBe(401);
  });

  test('consent flow cannot be started anonymously', async ({ request }) => {
    // Must not redirect to Google either: starting consent with no session
    // would leave nowhere to attach the resulting token.
    const res = await request.get('/api/drive/connect', { maxRedirects: 0 });
    expect(res.status()).toBe(401);
  });

  test('picker token endpoint rejects GET', async ({ request }) => {
    // Minting a credential on GET would make it reachable by a cross-site
    // prefetch or image tag. GET is the status endpoint, POST mints.
    const res = await request.get('/api/drive/connection');
    expect(res.status()).not.toBe(200);
  });
});
