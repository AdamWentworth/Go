import path from 'node:path';

import type { Page, Route } from '@playwright/test';

export type E2eRouteOptions = {
  mockImages?: boolean;
  searchResults?: unknown[];
  locationSuggestions?: unknown[];
  trainerSuggestions?: unknown[];
  userInstances?: unknown;
  publicUser?: unknown;
  userOverview?: unknown;
};

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

const defaultUserInstances = { username: 'e2e', instances: {} };
const defaultPublicUser = { user: { user_id: 'e2e-user', username: 'e2e' }, instances: {} };
const defaultUserOverview = {
  user: { user_id: 'e2e-user', username: 'e2e' },
  pokemon_instances: {},
  trades: {},
  related_instances: {},
  registrations: {},
};

export async function installE2eRoutes(page: Page, options: E2eRouteOptions = {}) {
  if (options.mockImages ?? true) {
    await page.route('**/images/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        path: placeholderImagePath,
      });
    });
  }

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
    await fulfillJson(route, options.searchResults ?? []);
  });

  await page.route('**/__e2e/search/searchPokemon**', async (route) => {
    await fulfillJson(route, options.searchResults ?? []);
  });

  await page.route('**/api/location/autocomplete**', async (route) => {
    await fulfillJson(route, options.locationSuggestions ?? []);
  });

  await page.route('**/__e2e/location/autocomplete**', async (route) => {
    await fulfillJson(route, options.locationSuggestions ?? []);
  });

  await page.route('**/api/location/reverse**', async (route) => {
    await fulfillJson(route, { locations: [] });
  });

  await page.route('**/__e2e/location/reverse**', async (route) => {
    await fulfillJson(route, { locations: [] });
  });

  await page.route('**/api/users/autocomplete-trainers**', async (route) => {
    await fulfillJson(route, options.trainerSuggestions ?? []);
  });

  await page.route('**/__e2e/users/autocomplete-trainers**', async (route) => {
    await fulfillJson(route, options.trainerSuggestions ?? []);
  });

  await page.route('**/api/users/instances/by-username/**', async (route) => {
    await fulfillJson(route, options.userInstances ?? defaultUserInstances);
  });

  await page.route('**/__e2e/users/instances/by-username/**', async (route) => {
    await fulfillJson(route, options.userInstances ?? defaultUserInstances);
  });

  await page.route('**/api/users/public/users/**', async (route) => {
    await fulfillJson(route, options.publicUser ?? defaultPublicUser);
  });

  await page.route('**/__e2e/users/public/users/**', async (route) => {
    await fulfillJson(route, options.publicUser ?? defaultPublicUser);
  });

  await page.route('**/api/users/users/*/overview**', async (route) => {
    await fulfillJson(route, options.userOverview ?? defaultUserOverview);
  });

  await page.route('**/__e2e/users/users/*/overview**', async (route) => {
    await fulfillJson(route, options.userOverview ?? defaultUserOverview);
  });
}
