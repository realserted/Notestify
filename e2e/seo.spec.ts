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
  for (const path of ['/about', '/faq', '/privacy', '/terms']) {
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

/**
 * Structured data fails the same way the sitemap does: a malformed block is
 * still valid HTML, still returns 200, and is simply dropped by Google with no
 * signal to anyone. These parse it the way a crawler would.
 */

const readJsonLd = async (page: import('@playwright/test').Page) => {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.map((raw) => JSON.parse(raw) as Record<string, unknown>);
};

test('the landing page claims the brand, not just the product', async ({ page }) => {
  await page.goto('/');
  const blocks = await readJsonLd(page);
  expect(blocks.length).toBeGreaterThan(0);

  const graph = blocks.flatMap((b) => (b['@graph'] as Array<Record<string, unknown>>) ?? [b]);
  const types = graph.map((node) => node['@type']);

  // SoftwareApplication alone describes what the app does. A search for
  // "notestify" asks about an entity, which is what these two answer.
  expect(types).toContain('Organization');
  expect(types).toContain('WebSite');

  const org = graph.find((node) => node['@type'] === 'Organization')!;
  expect(org.name).toBe('Notestify');
  // sameAs is what tells a search engine the GitHub repo and this site are one
  // entity rather than two strangers competing for the same word.
  expect(org.sameAs).toEqual(expect.arrayContaining([expect.stringContaining('github.com')]));
});

test('the FAQ markup matches the questions on the page', async ({ page }) => {
  await page.goto('/faq');

  const blocks = await readJsonLd(page);
  const faq = blocks.find((b) => b['@type'] === 'FAQPage');
  expect(faq, 'the FAQ page should emit FAQPage markup').toBeTruthy();

  const questions = (faq!.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>);
  expect(questions.length).toBeGreaterThanOrEqual(5);

  // Google ignores the markup entirely when it disagrees with the visible
  // page, so every marked-up question must actually be rendered.
  for (const { name, acceptedAnswer } of questions) {
    expect(acceptedAnswer.text.length).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }
});

test('llms.txt is served for answer engines', async ({ request }) => {
  const res = await request.get('/llms.txt');
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain('Notestify');
  expect(body).toContain('notestify.com');
});
