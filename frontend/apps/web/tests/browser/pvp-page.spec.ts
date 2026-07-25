import { expect, test, type Page } from '@playwright/test';

import { attachBrowserDiagnostics } from './support/diagnostics';
import { installE2eRoutes } from './support/e2eRoutes';

const pvpUser = {
  user_id: 'pvp-user',
  username: 'PvPTrainer',
  email: 'pvp@pokegonexus.local',
  accessTokenExpiry: '2099-01-01T00:00:00.000Z',
  refreshTokenExpiry: '2099-01-02T00:00:00.000Z',
};

const caughtBulbasaur = {
  instance_id: 'pvp-bulbasaur',
  variant_id: '0001-default',
  pokemon_id: 1,
  nickname: 'Sprout',
  is_caught: true,
  disabled: false,
  registered: true,
  cp: 1_200,
  level: 30,
  attack_iv: 4,
  defense_iv: 14,
  stamina_iv: 15,
  fast_move_id: 15,
  charged_move1_id: 108,
  charged_move2_id: 133,
};

const overCapBulbasaur = {
  ...caughtBulbasaur,
  instance_id: 'pvp-bulbasaur-over-cap',
  nickname: 'Over Cap',
  cp: 1_600,
  level: 50,
  attack_iv: 15,
  defense_iv: 15,
  stamina_iv: 15,
};

async function seedPvPRoster(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ user, caught }) =>
      new Promise<void>((resolve, reject) => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('ownershipTimestamp', String(Date.now()));

        const request = indexedDB.open('instancesDB', 2);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains('instances')) {
            database.createObjectStore('instances', {
              keyPath: 'instance_id',
            });
          }
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction('instances', 'readwrite');
          const store = transaction.objectStore('instances');
          store.clear();
          caught.forEach((instance) => store.put(instance));
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => {
            database.close();
            reject(transaction.error);
          };
        };
      }),
    { user: pvpUser, caught: [caughtBulbasaur, overCapBulbasaur] },
  );
}

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

      await page.getByRole('button', { name: 'Team Builder' }).click();
      await expect(page.getByRole('heading', { name: 'Team Builder', exact: true }))
        .toBeVisible();
      await page.getByRole('button', {
        name: 'Select Lead with Clodsire',
      }).click();
      await page.getByRole('button', {
        name: 'Select Safe Swap with Azumarill',
      }).click();
      await expect(page.getByText('2 / 3')).toBeVisible();
      await page.getByText('Published matchup evidence').click();
      await expect(page.getByText('Threatens 2 · Open')).toBeVisible();

      const teamLayout = await page.locator('.pvp-page').evaluate(() => ({
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
      }));
      expect(teamLayout.documentWidth).toBeLessThanOrEqual(teamLayout.viewportWidth);

      await page.getByRole('button', { name: 'Rankings' }).click();
      await page.getByRole('button', { name: 'Show details for Clodsire' }).click();
      await expect(page.getByRole('heading', { name: 'Strong matchups' })).toBeVisible();
      await expect(page.getByText('Talonflame')).toBeVisible();
      await page.getByRole('button', { name: 'Hide details for Clodsire' }).click();

      await page.getByRole('button', { name: 'Lead' }).click();
      await expect(page.getByText('Lead rankings')).toBeVisible();
      await expect(page.locator('.pvp-ranking-row').first()).toContainText('Azumarill');
      await expect(page.locator('.pvp-ranking-row').first()).toContainText('Lead');

      await page.getByRole('button', { name: /Ultra/ }).click();
      await expect(page.getByText('Feraligatr')).toBeVisible();
      await expect(page.getByText('Clodsire')).toHaveCount(0);
      await expect(page.getByText('1 ranked')).toBeVisible();

      await page.getByRole('button', { name: /Great/ }).click();
      await page.getByRole('button', { name: 'Battle Lab' }).click();
      await expect(
        page.getByText('Great League · focused 1v1 · June 2026 rules'),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Team battle' }).click();
      await expect(page.getByRole('button', { name: /Edit Side A Lead/ }))
        .toBeVisible();
      await expect(page.getByRole('button', { name: /Edit Side A Safe Swap/ }))
        .toBeVisible();
      await expect(page.getByRole('button', { name: /Edit Side A Closer/ }))
        .toBeVisible();
      await expect(page.getByRole('button', { name: /Adaptive/ }))
        .toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByText('Current 45-second battle clock')).toBeVisible();
      await page.getByRole('button', { name: 'Run team battle' }).click();
      await expect(page.getByText('Switch-aware 3v3 result')).toBeVisible();
      await page.getByRole('button', { name: /Test 3 meta teams/ }).click();
      await expect(page.getByText(
        'Wins, losses, and draws against current top role combinations.',
      )).toBeVisible();
      const battleLayout = await page.locator('.pvp-page').evaluate(() => ({
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
      }));
      expect(battleLayout.documentWidth).toBeLessThanOrEqual(
        battleLayout.viewportWidth,
      );

      await page.getByRole('button', { name: 'Rankings' }).click();
      const search = page.getByRole('searchbox', { name: 'Search PvP rankings' });
      await search.fill('play rough');
      await expect(page.getByText('Azumarill')).toBeVisible();
      await expect(page.getByText('Clodsire')).toHaveCount(0);

      await page.getByRole('button', { name: 'IV Rank' }).click();
      await expect(page.getByRole('heading', { name: 'PvP IV Rank' })).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'Current PvP cup' })).toHaveCount(0);
      const ivSearch = page.getByRole('searchbox', { name: 'Search IV Rank Pokémon' });
      await ivSearch.fill('Bulbasaur');
      await page.getByRole('button', {
        name: 'Select #0001 Bulbasaur',
      }).click();
      await expect(page.getByText('of 4,096')).toBeVisible();
      await expect(page.getByText('Rank 1 spread')).toBeVisible();
      await expect(page.getByRole('spinbutton', { name: 'Attack IV' })).toHaveValue('0');
      await expect(page.getByRole('spinbutton', { name: 'Defense IV' })).toHaveValue('15');
      await expect(page.getByRole('spinbutton', { name: 'HP IV' })).toHaveValue('15');

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

  test('opens a logged-in Trainer roster without an indefinite loading state', async ({
    page,
  }) => {
    const pvpComputeRequests: string[] = [];
    page.on('request', (request) => {
      if (
        request.url().includes('/pokemon/pvp-roster-evaluation') ||
        request.url().includes('/pokemon/pvp-battle')
      ) {
        pvpComputeRequests.push(request.url());
      }
    });
    await installE2eRoutes(page, {
      userInstances: {
        username: pvpUser.username,
        instances: {
          [caughtBulbasaur.instance_id]: caughtBulbasaur,
          [overCapBulbasaur.instance_id]: overCapBulbasaur,
        },
      },
    });
    const manifestLoaded = page.waitForResponse((response) =>
      /\/(?:api|__e2e)\/pokemon\/manifest$/.test(response.url()),
    );
    const pvpDataLoaded = page.waitForResponse((response) =>
      /\/(?:api|__e2e)\/pokemon\/pvp-data$/.test(response.url()),
    );
    await seedPvPRoster(page);
    await page.goto('/pvp', { waitUntil: 'domcontentloaded' });
    await Promise.all([manifestLoaded, pvpDataLoaded]);

    const myPokemon = page.getByRole('button', { name: 'My Pokémon' });
    await expect(myPokemon).toBeEnabled();
    const rosterStartedAt = Date.now();
    await myPokemon.click();

    await expect(myPokemon).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Sprout')).toBeVisible({ timeout: 8_000 });
    expect(Date.now() - rosterStartedAt).toBeLessThan(8_000);
    await expect(page.getByText('1 ready')).toBeVisible();
    await expect(page.getByText(
      /evaluated locally against 3 meta opponents/,
    )).toBeVisible();
    await expect(page.getByText('Build Overall')).toBeVisible();
    await expect(page.getByText(/Loading .*Pokémon/)).toHaveCount(0);

    await page.getByRole('button', { name: 'IV Rank' }).click();
    await expect(page.getByText(
      '1 eligible for Great League · 1 over cap hidden',
    )).toBeVisible();
    await expect(page.getByRole('button', {
      name: /Check Over Cap/,
    })).toHaveCount(0);
    const ivSearch = page.getByRole('searchbox', { name: 'Search IV Rank Pokémon' });
    await ivSearch.fill('Sprout');
    await page.getByRole('button', {
      name: /Check Sprout, Bulbasaur, IV 4\/14\/15, Meta rank 3, IV rank/,
    }).click();
    await expect(page.getByRole('region', { name: 'Your Bulbasaur' })).toBeVisible();
    await expect(page.getByRole('button', {
      name: /View Sprout, IV Rank/,
    })).toBeVisible();
    await expect(page.getByRole('region', { name: 'IV Rank result' }))
      .toContainText('Sprout');
    const viewport = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(viewport.documentWidth).toBeLessThanOrEqual(viewport.viewportWidth);
    expect(pvpComputeRequests).toEqual([]);
  });
});
