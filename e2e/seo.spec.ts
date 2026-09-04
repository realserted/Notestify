import { test, expect } from '@playwright/test';

/**
 * These exist because the sitemap and robots URLs come from
 * NEXT_PUBLIC_SITE_URL, and a build with the wrong value produces a sitemap
 * advertising localhost. That fails completely silently — the file is valid
 * XML, returns 200, and is simply invisible to Google.
 */

test('robots.txt is served and gates private routes', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.status()).toBe(200);

  const body = await res.text();
  expect(body).toContain('User-Agent: *');
  expect(body).toContain('Sitemap:');

  for (const path of ['/api/', '/admin', '/dashboard', '/settings']) {
    expect(body, `${path} should be disallowed`).toContain(`Disallow: ${path}`);
  }
});

test('sitemap lists the public pages and nothing private', async ({ request }) => {
  const res = await request.get('/sitemap.xml');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('xml');

  const body = await res.text();
  for (const path of ['/about', '/privacy', '/terms']) {
    expect(body).toContain(path);
  }

  // Login and register are excluded on purpose — dead ends in a search result.
  for (const path of ['/login', '/register', '/dashboard', '/admin']) {
    expect(body, `${path} should not be in the sitemap`).not.toContain(`<loc>${path}`);
  }
});

test('the landing page carries link-preview metadata', async ({ page }) => {
  await page.goto('/');

  const og = (property: string) =>
    page.locator(`meta[property="og:${property}"]`).getAttribute('content');

  expect(await og('title')).toBeTruthy();
  expect(await og('description')).toBeTruthy();
  expect(await og('image')).toBeTruthy();

  const twitterCard = await page
    .locator('meta[name="twitter:card"]')
    .getAttribute('content');
  expect(twitterCard).toBe('summary_large_image');
});

test('the Open Graph image renders', async ({ request }) => {
  const res = await request.get('/opengraph-image');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
  // A Satori failure yields a tiny or empty body rather than an error status.
  expect((await res.body()).byteLength).toBeGreaterThan(10_000);
});
