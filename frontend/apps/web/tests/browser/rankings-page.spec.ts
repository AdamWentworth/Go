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
  privacy_threshold: 5,
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
      most_wanted_users: null,
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

      await page.getByRole('tab', { name: 'Rarest owned' }).click();
      await expect(page.getByText('Owned by 2 trainers')).toBeVisible();
      await expect(page.getByText('8 trainers want this')).toHaveCount(0);

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

  test('is available while signed out', async ({ page }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      await installE2eRoutes(page, { communityRankings: rankings });
      await page.goto('/rankings', { waitUntil: 'domcontentloaded' });

      await expect(
        page.getByRole('heading', { name: 'Community Rankings' }),
      ).toBeVisible();
      await expect(page.getByText('12 trainers want this')).toBeVisible();
      await expect(
        page.getByText('Sign in to view community rankings'),
      ).toHaveCount(0);
    } finally {
      await diagnostics.flush();
    }

    expect(diagnostics.blockingErrors()).toEqual([]);
  });

  test('supports keyboard tabs, reduced motion, and responsive controls', async ({
    page,
  }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await installE2eRoutes(page, { communityRankings: rankings });
      await seedRankingsLogin(page);
      await page.goto('/rankings', { waitUntil: 'domcontentloaded' });

      const wantedTab = page.getByRole('tab', { name: 'Most wanted' });
      const rarestTab = page.getByRole('tab', { name: 'Rarest owned' });
      await wantedTab.focus();
      await page.keyboard.press('ArrowRight');
      await expect(rarestTab).toBeFocused();
      await expect(rarestTab).toHaveAttribute('aria-selected', 'true');

      const reducedMotionAnimation = await page.evaluate(() => {
        const probe = document.createElement('nav');
        probe.className = 'community-ranking-quick-controls';
        probe.hidden = true;
        document.body.append(probe);
        const animationName = getComputedStyle(probe).animationName;
        probe.remove();
        return animationName;
      });
      expect(reducedMotionAnimation).toBe('none');

      const controlMetrics = await page
        .locator('.community-ranking-filters button')
        .evaluateAll((controls) => ({
          minimumHeight: Math.min(
            ...controls.map((control) => control.getBoundingClientRect().height),
          ),
          overflow:
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        }));
      expect(controlMetrics.minimumHeight).toBeGreaterThanOrEqual(
        testInfo.project.name.startsWith('mobile') ? 40 : 24,
      );
      expect(controlMetrics.overflow).toBe(false);
    } finally {
      await diagnostics.flush();
    }

    expect(diagnostics.blockingErrors()).toEqual([]);
  });

  test('matches the public responsive visual baseline', async ({
    page,
  }, testInfo) => {
    test.skip(
      !['chromium-desktop', 'mobile-chrome'].includes(testInfo.project.name),
      'Visual baselines are maintained for representative desktop and mobile Chromium.',
    );
    await installE2eRoutes(page, { communityRankings: rankings });
    await page.goto('/rankings', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: 'Community Rankings' }),
    ).toBeVisible();

    await expect(page).toHaveScreenshot('community-rankings-public.png', {
      animations: 'disabled',
      fullPage: true,
      maxDiffPixelRatio: 0.05,
      mask: [page.locator('.community-rankings-updated')],
    });
  });
});
