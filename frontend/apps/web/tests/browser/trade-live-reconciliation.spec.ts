import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test';

import { attachBrowserDiagnostics } from './support/diagnostics';
import { installE2eRoutes } from './support/e2eRoutes';

const ash = {
  user_id: 'trade-user-1',
  username: 'ash',
  email: 'ash@example.invalid',
  accessTokenExpiry: '2099-01-01T00:00:00.000Z',
  refreshTokenExpiry: '2099-01-02T00:00:00.000Z',
};

const misty = {
  user_id: 'trade-user-2',
  username: 'misty',
  email: 'misty@example.invalid',
  accessTokenExpiry: '2099-01-01T00:00:00.000Z',
  refreshTokenExpiry: '2099-01-02T00:00:00.000Z',
};

const instances = {
  'trade-bulbasaur': {
    instance_id: 'trade-bulbasaur',
    user_id: ash.user_id,
    variant_id: '0001-default',
    pokemon_id: 1,
    nickname: 'Sprout',
    is_caught: true,
    is_for_trade: true,
    disabled: false,
  },
  'trade-charmander': {
    instance_id: 'trade-charmander',
    user_id: misty.user_id,
    variant_id: '0004-default',
    pokemon_id: 4,
    nickname: 'Ember',
    is_caught: true,
    is_for_trade: true,
    disabled: false,
  },
};

let trade = {
  trade_id: 'trade-live-e2e',
  user_id_proposed: ash.user_id,
  username_proposed: ash.username,
  user_id_accepting: misty.user_id,
  username_accepting: misty.username,
  pokemon_instance_id_user_proposed: 'trade-bulbasaur',
  pokemon_instance_id_user_accepting: 'trade-charmander',
  trade_status: 'proposed',
  trade_friendship_level: 'Forever',
  user_proposed_completion_confirmed: false,
  user_accepting_completion_confirmed: false,
  last_update: 100,
};

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function seedLogin(page: Page, user: typeof ash) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate((value) => localStorage.setItem('user', JSON.stringify(value)), user);
}

async function openTradeActivity(page: Page) {
  await page.goto('/trades', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Trade Activity' }).click();
  await expect(page.locator('.trade-activity-workspace')).toBeVisible();
  await expect.poll(() => page.evaluate(() => (
    window as unknown as { __e2eEventSourceCount?: () => number }
  ).__e2eEventSourceCount?.() ?? 0)).toBeGreaterThan(0);
}

async function emitTrade(page: Page) {
  const delivered = await page.evaluate(
    (payload) => (
      window as unknown as { __emitE2eEventSourceMessage: (message: unknown) => number }
    ).__emitE2eEventSourceMessage(payload),
    { trade: { [trade.trade_id]: trade }, relatedInstance: instances },
  );
  expect(delivered).toBeGreaterThan(0);
}

async function installTradeCommands(page: Page, actor: 'ash' | 'misty') {
  const handler = async (route: Route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith('/accept') && actor === 'misty') {
      trade = { ...trade, trade_status: 'pending', last_update: 200 };
      await fulfillJson(route, { trade, affected_instances: {} });
      return;
    }
    if (pathname.endsWith('/complete-confirmation')) {
      if (actor === 'misty') {
        trade = {
          ...trade,
          user_accepting_completion_confirmed: true,
          last_update: 300,
        };
      } else {
        trade = {
          ...trade,
          trade_status: 'completed',
          user_proposed_completion_confirmed: true,
          last_update: 400,
        };
      }
      await fulfillJson(route, { trade, affected_instances: {} });
      return;
    }
    await fulfillJson(route, { message: `Unexpected ${actor} trade command` }, 409);
  };

  for (const pattern of [
    '**/api/users/trades/trade-live-e2e/**',
    '**/__e2e/users/trades/trade-live-e2e/**',
  ]) {
    await page.route(pattern, handler);
  }
}

async function prepareParticipant(
  context: BrowserContext,
  user: typeof ash,
  actor: 'ash' | 'misty',
) {
  const page = await context.newPage();
  await installE2eRoutes(page, {
    trades: { [trade.trade_id]: trade },
    userOverview: { related_instances: instances },
  });
  await installTradeCommands(page, actor);
  await seedLogin(page, user);
  await openTradeActivity(page);
  return page;
}

test('reconciles acceptance and dual confirmation between two active trainers', async ({
  browser,
}, testInfo) => {
  trade = {
    ...trade,
    trade_status: 'proposed',
    user_proposed_completion_confirmed: false,
    user_accepting_completion_confirmed: false,
    last_update: 100,
  };
  const ashContext = await browser.newContext();
  const mistyContext = await browser.newContext();
  const ashPage = await prepareParticipant(ashContext, ash, 'ash');
  const mistyPage = await prepareParticipant(mistyContext, misty, 'misty');
  const ashDiagnostics = attachBrowserDiagnostics(ashPage, testInfo);
  const mistyDiagnostics = attachBrowserDiagnostics(mistyPage, testInfo);

  try {
    await expect(ashPage.getByRole('button', { name: /^Sent, 1/ })).toBeVisible();
    await expect(mistyPage.getByRole('button', { name: /^Needs response, 1/ })).toBeVisible();

    await mistyPage.getByRole('button', { name: 'Accept offer' }).click();
    await mistyPage.getByRole('button', { name: 'OK' }).click();
    await expect(mistyPage.getByRole('button', { name: /^Active, 1/ })).toBeVisible();
    await emitTrade(ashPage);

    await expect(ashPage.getByRole('button', { name: /^Sent, 0/ })).toBeVisible();
    await expect(ashPage.getByRole('button', { name: /^Active, 1/ })).toBeVisible();
    await expect(mistyPage.getByRole('button', { name: /^Active, 1/ })).toBeVisible();

    await mistyPage.getByRole('button', { name: /^Active, 1/ }).click();
    await mistyPage.getByRole('button', { name: 'Confirm Complete' }).click();
    await mistyPage.getByRole('button', { name: 'OK' }).click();
    await expect(mistyPage.getByRole('button', { name: 'Awaiting Partner...' })).toBeDisabled();
    await emitTrade(ashPage);

    await ashPage.getByRole('button', { name: /^Active, 1/ }).click();
    await expect(ashPage.getByRole('button', { name: 'Confirm Complete' })).toBeVisible();
    await ashPage.getByRole('button', { name: 'Confirm Complete' }).click();
    await ashPage.getByRole('button', { name: 'OK' }).click();
    await expect(ashPage.getByRole('button', { name: /^Completed, 1/ })).toBeVisible();
    await emitTrade(mistyPage);

    await expect(ashPage.getByRole('button', { name: /^Active, 0/ })).toBeVisible();
    await expect(ashPage.getByRole('button', { name: /^Completed, 1/ })).toBeVisible();
    await expect(mistyPage.getByRole('button', { name: /^Active, 0/ })).toBeVisible();
    await expect(mistyPage.getByRole('button', { name: /^Completed, 1/ })).toBeVisible();
    expect(ashDiagnostics.blockingErrors()).toEqual([]);
    expect(mistyDiagnostics.blockingErrors()).toEqual([]);
  } finally {
    await ashContext.close();
    await mistyContext.close();
  }
});
