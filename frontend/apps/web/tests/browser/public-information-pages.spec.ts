import { expect, test } from '@playwright/test';

import { attachBrowserDiagnostics } from './support/diagnostics';
import { installE2eRoutes } from './support/e2eRoutes';

test.describe('public information pages', () => {
  test('exposes About, Safety, and a useful unknown-route fallback', async ({ page }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);
    await installE2eRoutes(page);

    try {
      await page.goto('/about', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'About Pokémon Go Nexus' })).toBeVisible();
      await expect(page).toHaveTitle('About | Pokémon Go Nexus');
      await expect(page.getByRole('link', { name: /Getting Started/i })).toBeVisible();

      await page.goto('/safety', { waitUntil: 'domcontentloaded' });
      await expect(
        page.getByRole('heading', { name: 'Trade Safety & Community Guidelines' }),
      ).toBeVisible();
      await expect(page).toHaveTitle(/Trade Safety & Community Guidelines/);
      await expect(page.getByText(/Pokémon Go Nexus plans the exchange/i)).toBeVisible();

      await page.goto('/old-or-mistyped-route', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'That route wandered off.' })).toBeVisible();
      await expect(page.getByText('/old-or-mistyped-route')).toBeVisible();
      await expect(page).toHaveTitle('Page Not Found | Pokémon Go Nexus');

      const widths = await page.evaluate(() => ({
        body: document.body.scrollWidth,
        document: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
      }));
      expect(widths.body).toBeLessThanOrEqual(widths.viewport);
      expect(widths.document).toBeLessThanOrEqual(widths.viewport);
    } finally {
      await diagnostics.flush();
    }

    expect(diagnostics.blockingErrors()).toEqual([]);
  });
});
