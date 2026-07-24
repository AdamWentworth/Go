import { expect, test } from '@playwright/test';

import { attachBrowserDiagnostics } from './support/diagnostics';
import { installE2eRoutes } from './support/e2eRoutes';

test.describe('PvP rankings page', () => {
  test('supports league rankings and search without horizontal overflow', async ({
    page,
  }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      await installE2eRoutes(page);
      await page.goto('/pvp');

      await expect(page.getByRole('heading', { name: 'PvP Rankings' })).toBeVisible();
      await expect(page.getByRole('button', { name: /Great/ })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await expect(page.getByRole('button', { name: 'All Pokémon' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await expect(page.getByRole('button', { name: 'My Pokémon' })).toBeDisabled();
      await expect(page.getByText('Clodsire')).toBeVisible();
      await expect(page.getByText('Azumarill')).toBeVisible();
      await expect(page.locator('.pvp-rank--gold')).toHaveText('1');
      await expect(page.locator('.pvp-rank--silver')).toHaveText('2');

      await page.getByRole('button', { name: 'Lead' }).click();
      await expect(page.getByText('Lead rankings')).toBeVisible();
      await expect(page.locator('.pvp-ranking-row').first()).toContainText('Azumarill');
      await expect(page.locator('.pvp-ranking-row').first()).toContainText('Lead');

      await page.getByRole('button', { name: /Ultra/ }).click();
      await expect(page.getByText('Feraligatr')).toBeVisible();
      await expect(page.getByText('Clodsire')).toHaveCount(0);
      await expect(page.getByText('1 ranked')).toBeVisible();

      await page.getByRole('button', { name: /Great/ }).click();
      const search = page.getByRole('searchbox', { name: 'Search PvP rankings' });
      await search.fill('play rough');
      await expect(page.getByText('Azumarill')).toBeVisible();
      await expect(page.getByText('Clodsire')).toHaveCount(0);

      const layout = await page.locator('.pvp-page').evaluate(() => ({
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        rankingWidths: Array.from(document.querySelectorAll('.pvp-ranking-row')).map(
          (element) => element.getBoundingClientRect().width,
        ),
      }));
      expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
      expect(layout.rankingWidths.every((width) => width <= layout.viewportWidth)).toBe(true);
    } finally {
      await diagnostics.flush();
    }

    expect(diagnostics.blockingErrors()).toEqual([]);
  });
});
