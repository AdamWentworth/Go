import { expect, test, type Page, type Route } from '@playwright/test';

import { installE2eRoutes } from './support/e2eRoutes';

const user = {
  user_id: 'trade-user-2',
  username: 'misty',
  email: 'misty@example.invalid',
  accessTokenExpiry: '2099-01-01T00:00:00.000Z',
  refreshTokenExpiry: '2099-01-02T00:00:00.000Z',
};

const instances = {
  'trade-bulbasaur': {
    instance_id: 'trade-bulbasaur',
    user_id: 'trade-user-1',
    variant_id: '0001-default',
    pokemon_id: 1,
    nickname: 'Sprout',
    is_caught: true,
    is_for_trade: true,
    disabled: false,
  },
  'trade-charmander': {
    instance_id: 'trade-charmander',
    user_id: 'trade-user-2',
    variant_id: '0004-default',
    pokemon_id: 4,
    nickname: 'Ember',
    is_caught: true,
    is_for_trade: true,
    disabled: false,
  },
};

const proposedTrade = {
  trade_id: 'trade-e2e',
  user_id_proposed: 'trade-user-1',
  username_proposed: 'ash',
  user_id_accepting: 'trade-user-2',
  username_accepting: 'misty',
  pokemon_instance_id_user_proposed: 'trade-bulbasaur',
  pokemon_instance_id_user_accepting: 'trade-charmander',
  trade_status: 'proposed',
  trade_friendship_level: 'Great',
  user_proposed_completion_confirmed: false,
  user_accepting_completion_confirmed: false,
  last_update: 100,
};

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function seedLogin(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate((value) => {
    localStorage.setItem('user', JSON.stringify(value));
  }, user);
}

test('accepts and confirms a trade through authoritative commands', async ({
  page,
}) => {
  let trade = { ...proposedTrade };
  const calls: string[] = [];
  await installE2eRoutes(page, {
    trades: { [trade.trade_id]: trade },
    userOverview: { related_instances: instances },
  });
  await page.route('**/__e2e/users/trades/trade-e2e/**', async (route) => {
    const url = new URL(route.request().url());
    calls.push(url.pathname);
    if (url.pathname.endsWith('/accept')) {
      trade = { ...trade, trade_status: 'pending', last_update: 200 };
      await json(route, { trade, affected_instances: {} });
      return;
    }
    if (url.pathname.endsWith('/complete-confirmation')) {
      trade = {
        ...trade,
        user_accepting_completion_confirmed: true,
        last_update: 300,
      };
      await json(route, { trade, affected_instances: {} });
      return;
    }
    await json(route, { message: 'Unhandled trade command' }, 404);
  });

  await seedLogin(page);
  await page.goto('/trades');
  await page.getByRole('button', { name: 'Offers' }).click();
  await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible();
  await page.getByRole('button', { name: 'Accept' }).click();
  await page.getByRole('button', { name: 'OK' }).click();

  await page.getByRole('button', { name: 'Pending' }).click();
  await expect(page.getByRole('button', { name: 'Confirm Complete' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm Complete' }).click();
  await page.getByRole('button', { name: 'OK' }).click();

  await expect(page.getByRole('button', { name: 'Awaiting Partner...' })).toBeDisabled();
  expect(calls).toEqual([
    '/__e2e/users/trades/trade-e2e/accept',
    '/__e2e/users/trades/trade-e2e/complete-confirmation',
  ]);
});

test('keeps canonical trade state and explains a rejected server command', async ({
  page,
}) => {
  await installE2eRoutes(page, {
    trades: { [proposedTrade.trade_id]: proposedTrade },
    userOverview: { related_instances: instances },
  });
  await page.route('**/__e2e/users/trades/trade-e2e/accept', async (route) => {
    await json(route, { message: 'This trade changed on another device.' }, 409);
  });

  await seedLogin(page);
  await page.goto('/trades');
  await page.getByRole('button', { name: 'Offers' }).click();
  await page.getByRole('button', { name: 'Accept' }).click();
  await page.getByRole('button', { name: 'OK' }).click();

  const failureMessage = page.getByText('This trade changed on another device.');
  await expect(failureMessage).toBeVisible();
  await failureMessage.click();
  await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible();
});
