import { expect, test } from '@playwright/test';

import { installE2eRoutes } from './support/e2eRoutes';

const routes = ['/login', '/register', '/terms', '/privacy', '/data-deletion'];

for (const route of routes) {
  test(`${route} fits the viewport without horizontal overflow`, async ({ page }) => {
    await installE2eRoutes(page);
    await page.goto(route);
    await expect(page.locator('body')).toBeVisible();

    const widths = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(widths.documentWidth).toBeLessThanOrEqual(widths.viewportWidth);
  });
}

test('mobile Terms content and footer remain readable inside the viewport', async ({ page }) => {
  await installE2eRoutes(page);
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/terms');

  const document = page.locator('.legal-document');
  await expect(document.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
  await expect(document.getByRole('link', { name: 'Return to PokeGoNexus' })).toBeVisible();
  await expect(
    document.locator('footer').getByRole('link', { name: 'admin@pokegonexus.com' }),
  ).toBeVisible();

  const bounds = await document.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(360);
});
