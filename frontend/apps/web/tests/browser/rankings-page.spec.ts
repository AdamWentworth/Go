import { expect, test, type Page } from '@playwright/test';
import { attachBrowserDiagnostics } from './support/diagnostics';
import { installE2eRoutes } from './support/e2eRoutes';

const rankingsUser = {
  user_id: 'rankings-user',
  username: 'RankingsTrainer',
  email: 'rankings@pokegonexus.local',
  accessTokenExpiry: '2099-01-01T00:00:00.000Z',
  refreshTokenExpiry: '2099-01-02T00:00:00.000Z',
};

const rankings = {
  snapshot: {
    collector_users: 18,
    wishlist_users: 15,
    updated_at: '2026-07-25T12:00:00Z',
  },
  most_wanted: [
    {
      variant_id: '0001-default',
      wanted_users: 12,
      most_wanted_users: 4,
      caught_users: 9,
    },
    {
      variant_id: '0004-default',
      wanted_users: 8,
      most_wanted_users: 2,
      caught_users: 11,
    },
  ],
  rarest: [
    {
      variant_id: '0004-default',
      wanted_users: 8,
      most_wanted_users: 2,
      caught_users: 2,
    },
    {
      variant_id: '0001-default',
      wanted_users: 12,
      most_wanted_users: 4,
      caught_users: 9,
    },
  ],
};

async function seedRankingsLogin(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate((user) => {
    localStorage.setItem('user', JSON.stringify(user));
  }, rankingsUser);
}

test.describe('Community rankings page', () => {
  test('shows wanted and rarity counts without horizontal overflow', async ({
    page,
  }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      await installE2eRoutes(page, { communityRankings: rankings });
      await seedRankingsLogin(page);
      await page.goto('/rankings', { waitUntil: 'domcontentloaded' });

      await expect(
        page.getByRole('heading', { name: 'Community Rankings' }),
      ).toBeVisible();
      await expect(page.getByText('12 trainers want this')).toBeVisible();
      await expect(
        page.getByText('One vote per trainer. Duplicate copies count once.'),
      ).toBeVisible();

      await page.getByRole('tab', { name: 'Rarest caught' }).click();
      await expect(page.getByText('Caught by 2 trainers')).toBeVisible();

      const search = page.getByRole('searchbox', { name: 'Search rankings' });
      await search.fill('Charmander');
      await expect(page.getByText('Charmander')).toBeVisible();
      await expect(page.getByText('Bulbasaur')).toHaveCount(0);

      const layout = await page.locator('.community-rankings-page').evaluate(() => ({
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        rowWidths: Array.from(
          document.querySelectorAll('.community-ranking-row'),
        ).map((element) => element.getBoundingClientRect().width),
      }));
      expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
      expect(layout.rowWidths.every((width) => width <= layout.viewportWidth))
        .toBe(true);
    } finally {
      await diagnostics.flush();
    }

    expect(diagnostics.blockingErrors()).toEqual([]);
  });
});
