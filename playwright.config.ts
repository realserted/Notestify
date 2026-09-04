import { defineConfig, devices } from '@playwright/test';

/**
 * Runs against a local production build by default. `next dev` is too slow and
 * too forgiving — several things that matter here (sitemap and robots output,
 * static prerendering, metadata) only behave correctly in a real build.
 *
 * Point PLAYWRIGHT_BASE_URL at a preview deployment to test that instead, in
 * which case the local server is not started.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const isRemote = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL,
    trace: 'on-first-retry',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: isRemote
    ? undefined
    : {
        command: 'npm run build && npm run start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
