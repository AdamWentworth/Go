import path from 'node:path';

import type { Page, Route } from '@playwright/test';

const fixturePath = (relativePath: string) =>
  path.resolve(process.cwd(), '../../packages/app-core/tests/__helpers__/fixtures', relativePath);
const placeholderImagePath = path.resolve(
  process.cwd(),
  '../../packages/app-core/public/icons/icon-48x48.png',
);

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function installE2eRoutes(page: Page) {
  await page.route('**/images/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      path: placeholderImagePath,
    });
  });

  await page.route('**/api/pokemon/pokemons', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { etag: '"e2e-pokemons"' },
      path: fixturePath('pokemons.json'),
    });
  });

  await page.route('**/__e2e/pokemon/pokemons', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { etag: '"e2e-pokemons"' },
      path: fixturePath('pokemons.json'),
    });
  });

  await page.route('**/api/search/searchPokemon**', async (route) => {
    await fulfillJson(route, []);
  });

  await page.route('**/__e2e/search/searchPokemon**', async (route) => {
    await fulfillJson(route, []);
  });

  await page.route('**/api/location/autocomplete**', async (route) => {
    await fulfillJson(route, []);
  });

  await page.route('**/__e2e/location/autocomplete**', async (route) => {
    await fulfillJson(route, []);
  });

  await page.route('**/api/location/reverse**', async (route) => {
    await fulfillJson(route, { locations: [] });
  });

  await page.route('**/__e2e/location/reverse**', async (route) => {
    await fulfillJson(route, { locations: [] });
  });

  await page.route('**/api/users/autocomplete-trainers**', async (route) => {
    await fulfillJson(route, []);
  });

  await page.route('**/__e2e/users/autocomplete-trainers**', async (route) => {
    await fulfillJson(route, []);
  });

  await page.route('**/api/users/instances/by-username/**', async (route) => {
    await fulfillJson(route, { username: 'e2e', instances: {} });
  });

  await page.route('**/__e2e/users/instances/by-username/**', async (route) => {
    await fulfillJson(route, { username: 'e2e', instances: {} });
  });

  await page.route('**/api/users/public/users/**', async (route) => {
    await fulfillJson(route, { user: { user_id: 'e2e-user', username: 'e2e' }, instances: {} });
  });

  await page.route('**/__e2e/users/public/users/**', async (route) => {
    await fulfillJson(route, { user: { user_id: 'e2e-user', username: 'e2e' }, instances: {} });
  });

  await page.route('**/api/users/users/*/overview**', async (route) => {
    await fulfillJson(route, {
      user: { user_id: 'e2e-user', username: 'e2e' },
      pokemon_instances: {},
      trades: {},
      related_instances: {},
      registrations: {},
    });
  });

  await page.route('**/__e2e/users/users/*/overview**', async (route) => {
    await fulfillJson(route, {
      user: { user_id: 'e2e-user', username: 'e2e' },
      pokemon_instances: {},
      trades: {},
      related_instances: {},
      registrations: {},
    });
  });
}
