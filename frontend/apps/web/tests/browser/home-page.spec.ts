import { expect, test } from '@playwright/test';

import { attachBrowserDiagnostics } from './support/diagnostics';
import { installE2eRoutes } from './support/e2eRoutes';

const dashboardInstance = (
  instanceId: string,
  variantId: string,
  pokemonId: number,
  overrides: Record<string, unknown>,
) => ({
  date_added: '2026-08-20T00:00:00.000Z',
  instance_id: instanceId,
  is_caught: false,
  is_for_trade: false,
  is_wanted: false,
  favorite: false,
  most_wanted: false,
  last_update: Date.parse('2026-08-20T00:00:00.000Z'),
  nickname: null,
  pokemon_id: pokemonId,
  registered: true,
  user_id: 'home-user',
  variant_id: variantId,
  ...overrides,
});

const addSignedInUser = async (page: Parameters<typeof installE2eRoutes>[0]) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('user', JSON.stringify({
      accessTokenExpiry: '2099-01-01T00:00:00.000Z',
      allowLocation: false,
      email: 'home@example.test',
      location: '',
      pokemonGoName: 'HomeTrainerGO',
      refreshTokenExpiry: '2099-01-02T00:00:00.000Z',
      trainerCode: '',
      user_id: 'home-user',
      username: 'HomeTrainer',
    }));
  });
};

const seedDashboardInstances = async (
  page: Parameters<typeof installE2eRoutes>[0],
  instances: Record<string, Record<string, unknown>>,
) => {
  await page.evaluate((records) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('instancesDB');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('instances')) {
        db.close();
        reject(new Error('instances store was not initialized'));
        return;
      }

      const transaction = db.transaction('instances', 'readwrite');
      const store = transaction.objectStore('instances');
      store.clear();
      Object.values(records).forEach((record) => store.put(record));
      transaction.oncomplete = () => {
        db.close();
        window.localStorage.setItem('ownershipTimestamp', String(Date.now()));
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    };
  }), instances);
};

test.describe('Home page', () => {
  test('presents real product workflows to signed-out visitors without mobile overflow', async ({ page }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);
    await page.setViewportSize({ width: 390, height: 844 });
    await installE2eRoutes(page);

    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Your collection. Better connected.' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'From catalog to completed trade' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Share beyond the app' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Build your collection' })).toBeVisible();

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

  test('summarizes authenticated collection, trade, and friend actions responsively', async ({ page }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);
    const mobileProject = testInfo.project.name.includes('mobile');
    await page.setViewportSize(mobileProject
      ? { width: 390, height: 844 }
      : { width: 1280, height: 900 });
    await addSignedInUser(page);

    const pokemonInstances = {
      favorite: dashboardInstance('favorite', '0001-default', 1, {
        favorite: true,
        is_caught: true,
        last_update: 4,
      }),
      trade: dashboardInstance('trade', '0006-default', 6, {
        is_caught: true,
        is_for_trade: true,
        last_update: 3,
      }),
      wanted: dashboardInstance('wanted', '0025-default', 25, {
        is_wanted: true,
        most_wanted: true,
        last_update: 2,
      }),
    };
    const trades = {
      incoming: {
        trade_id: 'incoming',
        trade_status: 'proposed',
        username_accepting: 'HomeTrainer',
        username_proposed: 'OtherTrainer',
      },
      confirm: {
        trade_id: 'confirm',
        trade_status: 'pending',
        username_accepting: 'HomeTrainer',
        user_accepting_completion_confirmed: false,
      },
    };

    await installE2eRoutes(page, {
      friendsOverview: {
        friends: [],
        incoming: [{
          friendship_id: 'friendship-1',
          user_id: 'friend-user',
          username: 'NewFriend',
          direction: 'incoming',
        }],
        outgoing: [],
        blocked: [],
      },
      trades,
      userOverview: {
        user: { user_id: 'home-user', username: 'HomeTrainer' },
        pokemon_instances: pokemonInstances,
        trades,
        related_instances: {},
        registrations: {},
      },
    });

    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Welcome back, HomeTrainerGO' })).toBeVisible();
      await seedDashboardInstances(page, pokemonInstances);
      await page.reload({ waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('heading', { name: '3 items need your attention' })).toBeVisible();
      await expect(page.getByText('1 offer to review')).toBeVisible();
      await expect(page.getByText('1 trade ready to confirm')).toBeVisible();
      await expect(page.getByText('1 friend request')).toBeVisible();
      await expect(page.getByRole('link', { name: /1 For Trade/ })).toBeVisible();
      await expect(page.getByRole('link', { name: /1 Wanted/ })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Your latest Pokémon' })).toBeVisible();

      const widths = await page.evaluate(() => ({
        body: document.body.scrollWidth,
        document: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
      }));
      expect(widths.body).toBeLessThanOrEqual(widths.viewport);
      expect(widths.document).toBeLessThanOrEqual(widths.viewport);

      await page.evaluate(() => {
        window.localStorage.setItem('isLightMode', 'true');
      });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await expect(page.getByRole('heading', { name: 'Welcome back, HomeTrainerGO' })).toBeVisible();
    } finally {
      await diagnostics.flush();
    }

    expect(diagnostics.blockingErrors()).toEqual([]);
  });
});
