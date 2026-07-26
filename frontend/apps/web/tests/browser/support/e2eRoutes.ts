import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { Page, Route } from '@playwright/test';

export type E2eRouteOptions = {
  mockImages?: boolean;
  searchResults?: unknown[];
  communityRankings?: unknown;
  locationSuggestions?: unknown[];
  trainerSuggestions?: unknown[];
  trainerProfile?: unknown;
  userInstances?: unknown;
  publicUser?: unknown;
  userOverview?: unknown;
  raidDataDelayMs?: number;
};

const fixturePath = (relativePath: string) =>
  path.resolve(process.cwd(), '../../packages/app-core/tests/__helpers__/fixtures', relativePath);
const placeholderImagePath = path.resolve(
  process.cwd(),
  '../../packages/app-core/public/icons/icon-48x48.png',
);

type PokemonFixtureEntry = Record<string, unknown>;

const pokemonFixture = JSON.parse(
  readFileSync(fixturePath('pokemons.json'), 'utf8'),
) as PokemonFixtureEntry[];

const asRecords = (value: unknown): PokemonFixtureEntry[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is PokemonFixtureEntry => !!entry && typeof entry === 'object')
    : [];

const stripMovePools = (value: unknown): PokemonFixtureEntry[] =>
  asRecords(value).map((entry) => ({ ...entry, moves: [] }));

const catalogFixture = pokemonFixture.map((pokemon) => ({
  ...pokemon,
  moves: [],
  raid_boss: [],
  fusion: stripMovePools(pokemon.fusion),
  crownForms: stripMovePools(pokemon.crownForms),
}));

const movesFixture = pokemonFixture.map((pokemon) => ({
  pokemon_id: pokemon.pokemon_id,
  moves: Array.isArray(pokemon.moves) ? pokemon.moves : [],
  fusion: asRecords(pokemon.fusion).map((fusion) => ({
    fusion_id: fusion.fusion_id,
    moves: Array.isArray(fusion.moves) ? fusion.moves : [],
  })),
  crownForms: asRecords(pokemon.crownForms).map((crown) => ({
    id: crown.id,
    moves: Array.isArray(crown.moves) ? crown.moves : [],
  })),
}));

const raidDataFixture = pokemonFixture.map((pokemon) => ({
  pokemon_id: pokemon.pokemon_id,
  raid_boss: Array.isArray(pokemon.raid_boss) ? pokemon.raid_boss : [],
}));

const maxDataFixture = pokemonFixture.filter((pokemon) => {
  const pokemonId = Number(pokemon.pokemon_id);
  return asRecords(pokemon.max).length > 0 || [888, 889, 890].includes(pokemonId);
});

const makePvPEntry = (
  rank: number,
  speciesId: string,
  name: string,
  type: string,
  moveName: string,
  pokemonId = rank,
) => ({
  rank,
  sourceRank: rank,
  speciesId,
  name,
  pokemonId,
  variantKind: 'pokemon',
  imageUrl: `/images/pokemon/${rank}.png`,
  types: [type],
  moveset: [
    {
      id: `${speciesId}-fast`,
      name: 'Quick Attack',
      type: 'normal',
      kind: 'fast',
      power: 5,
      energyGain: 8,
      energyCost: 0,
      turns: 2,
      buff: {
        attackerAttack: 0,
        attackerDefense: 0,
        targetAttack: 0,
        targetDefense: 0,
        chance: 0,
      },
    },
    {
      id: `${speciesId}-charged`,
      name: moveName,
      type,
      kind: 'charged',
      power: 80,
      energyGain: 0,
      energyCost: 50,
      turns: 1,
      buff: {
        attackerAttack: 0,
        attackerDefense: 0,
        targetAttack: 0,
        targetDefense: 0,
        chance: 0,
      },
    },
  ],
  score: 96 - rank,
  rating: 700,
  categoryScores: rank === 1
    ? [70, 72, 74, 76, 78, 80]
    : [90, 88, 86, 84, 82, 81],
  matchups: [
    { speciesId: 'talonflame', rating: 740 - rank },
  ],
  counters: [
    { speciesId: 'lanturn', rating: 310 + rank },
  ],
  moveUsage: [
    {
      id: `${speciesId}-fast`,
      name: 'Quick Attack',
      type: 'normal',
      kind: 'fast',
      uses: 120,
    },
  ],
  recommendedLevel: 20 + rank / 2,
  attackIv: 0,
  defenseIv: 15,
  staminaIv: 15,
  battleAttack: 100 + rank,
  battleDefense: 130 - rank,
  battleHp: 140 + rank,
  statProduct: (100 + rank) * (130 - rank) * (140 + rank),
});

const pvpDataFixture = {
  source: {
    name: 'PvPoke',
    version: 'e2e-pvpoke',
    url: 'https://github.com/pvpoke/pvpoke',
    license: 'MIT',
    importedAt: '2026-07-23T00:00:00Z',
    metadata: {},
  },
  leagues: {
    great: {
      key: 'great',
      label: 'Great League',
      cpLimit: 1_500,
      entries: [
        makePvPEntry(1, 'clodsire', 'Clodsire', 'poison', 'Earthquake'),
        makePvPEntry(2, 'azumarill', 'Azumarill', 'water', 'Play Rough'),
        makePvPEntry(3, 'bulbasaur', 'Bulbasaur', 'grass', 'Seed Bomb', 1),
      ],
    },
    ultra: {
      key: 'ultra',
      label: 'Ultra League',
      cpLimit: 2_500,
      entries: [
        makePvPEntry(1, 'feraligatr', 'Feraligatr', 'water', 'Hydro Cannon'),
      ],
    },
    master: {
      key: 'master',
      label: 'Master League',
      cpLimit: null,
      entries: [
        makePvPEntry(1, 'zacian_crowned_sword', 'Zacian Crowned Sword', 'steel', 'Behemoth Blade'),
      ],
    },
  },
};

const pokemonManifestFixture = {
  schemaVersion: 3,
  catalogVersion: 'e2e-catalog-v3',
  generatedAt: '2026-07-14T00:00:00.000Z',
  chunks: {
    pokemonFull: {
      name: 'pokemonFull',
      endpoint: '/pokemons',
      contentType: 'application/json',
      etag: '"e2e-pokemons"',
      version: 'e2e-pokemons',
      bytesJson: 1,
      bytesGzip: 1,
    },
    catalog: {
      name: 'catalog',
      endpoint: '/catalog',
      contentType: 'application/json',
      etag: '"e2e-catalog-v2"',
      version: 'e2e-catalog-v2',
      bytesJson: 1,
      bytesGzip: 1,
    },
    moves: {
      name: 'moves',
      endpoint: '/moves',
      contentType: 'application/json',
      etag: '"e2e-moves-v2"',
      version: 'e2e-moves-v2',
      bytesJson: 1,
      bytesGzip: 1,
    },
    raidData: {
      name: 'raidData',
      endpoint: '/raid-data',
      contentType: 'application/json',
      etag: '"e2e-raid-data-v2"',
      version: 'e2e-raid-data-v2',
      bytesJson: 1,
      bytesGzip: 1,
    },
    maxData: {
      name: 'maxData',
      endpoint: '/max-data',
      contentType: 'application/json',
      etag: '"e2e-max-data-v1"',
      version: 'e2e-max-data-v1',
      bytesJson: 1,
      bytesGzip: 1,
    },
    pvpData: {
      name: 'pvpData',
      endpoint: '/pvp-data',
      contentType: 'application/json',
      etag: '"e2e-pvp-data-v1"',
      version: 'e2e-pvp-data-v1',
      bytesJson: 1,
      bytesGzip: 1,
    },
  },
};

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
  let trainerProfileState = JSON.parse(
    JSON.stringify(
      options.trainerProfile ?? {
        user: {
          user_id: 'e2e-user',
          username: 'e2e',
          app_joined_at: '2026-01-01T00:00:00Z',
        },
        trainer_titles: [],
        location: null,
        trainer_code: null,
        stats: {
          caught: 0,
          for_trade: 0,
          wanted: 0,
          favorites: 0,
          registered: 0,
        },
        highlights: [],
        viewer: {
          relationship: 'self',
          can_view_profile: true,
          can_view_collection: true,
        },
      },
    ),
  ) as Record<string, unknown>;

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

  for (const pathPattern of ['**/api/pokemon/manifest', '**/__e2e/pokemon/manifest']) {
    await page.route(pathPattern, async (route) => {
      await fulfillJson(route, pokemonManifestFixture);
    });
  }

  for (const pathPattern of ['**/api/pokemon/catalog', '**/__e2e/pokemon/catalog']) {
    await page.route(pathPattern, async (route) => {
      await fulfillJson(route, catalogFixture);
    });
  }

  for (const pathPattern of ['**/api/pokemon/moves', '**/__e2e/pokemon/moves']) {
    await page.route(pathPattern, async (route) => {
      await fulfillJson(route, movesFixture);
    });
  }

  for (const pathPattern of ['**/api/pokemon/raid-data', '**/__e2e/pokemon/raid-data']) {
    await page.route(pathPattern, async (route) => {
      if (options.raidDataDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, options.raidDataDelayMs));
      }
      await fulfillJson(route, raidDataFixture);
    });
  }

  for (const pathPattern of ['**/api/pokemon/max-data', '**/__e2e/pokemon/max-data']) {
    await page.route(pathPattern, async (route) => {
      await fulfillJson(route, maxDataFixture);
    });
  }

  for (const pathPattern of ['**/api/pokemon/pvp-data', '**/__e2e/pokemon/pvp-data']) {
    await page.route(pathPattern, async (route) => {
      await fulfillJson(route, pvpDataFixture);
    });
  }

  await page.route('**/api/search/searchPokemon**', async (route) => {
    await fulfillJson(route, options.searchResults ?? []);
  });

  await page.route('**/__e2e/search/searchPokemon**', async (route) => {
    await fulfillJson(route, options.searchResults ?? []);
  });

  const rankings = options.communityRankings ?? {
    snapshot: {
      collector_users: 0,
      wishlist_users: 0,
      updated_at: '2026-07-25T12:00:00Z',
    },
    most_wanted: [],
    rarest: [],
  };
  await page.route('**/api/search/rankings**', async (route) => {
    await fulfillJson(route, rankings);
  });
  await page.route('**/__e2e/search/rankings**', async (route) => {
    await fulfillJson(route, rankings);
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

  for (const pathPattern of ['**/api/users/profile', '**/__e2e/users/profile']) {
    await page.route(pathPattern, async (route) => {
      if (route.request().method() === 'PUT') {
        const update = route.request().postDataJSON() as Record<string, unknown>;
        if (Array.isArray(update.trainer_titles)) {
          trainerProfileState = {
            ...trainerProfileState,
            trainer_titles: [...update.trainer_titles],
          };
        }
        await fulfillJson(route, { success: true });
        return;
      }
      await fulfillJson(route, trainerProfileState);
    });
  }

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
