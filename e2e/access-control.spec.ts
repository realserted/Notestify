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
