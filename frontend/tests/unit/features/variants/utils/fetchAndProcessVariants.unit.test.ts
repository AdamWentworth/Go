// tests/unit/features/variants/utils/fetchAndProcessVariants.unit.test.ts
import {
  describe, it, expect, vi, beforeEach, afterEach,
  type Mock,                    // ← added
} from 'vitest';

/* ──────────────────────────────────────────────────────────
 * 1. JSON fixtures  (tsconfig needs "resolveJsonModule": true)
 * ────────────────────────────────────────────────────────── */
import pokemonApiRaw from '../../../../__helpers__/fixtures/pokemons.json';
import variantsRaw   from '../../../../__helpers__/fixtures/variants.json';

const pokemonApiFixture = pokemonApiRaw as any[];
const variantsFixture   = variantsRaw   as any[];

/* ──────────────────────────────────────────────────────────
 * 2.  Prepare mocks – declare any shared vars *before* factories
 * ────────────────────────────────────────────────────────── */
const preloadMock = vi.fn(); //  <-- we’ll assert against this later

vi.mock('@/services/pokemonDataService', () => ({
  __esModule: true,
  getPokemons: vi.fn(),
}));

vi.mock('@/utils/loggers', () => ({
  __esModule: true,
  logSize: vi.fn(),
}));

vi.mock('@/features/variants/utils/createPokemonVariants', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('@/utils/PokemonIDUtils', () => ({
  __esModule: true,
  determinePokemonKey: vi.fn(),
}));

vi.mock('@/stores/useImageStore', () => ({
  __esModule: true,
  useImageStore: {
    getState: () => ({ preload: preloadMock }), // uses the var above
  },
}));

vi.mock('@/db/pokemonDB', () => ({
  __esModule: true,
  putBulkIntoDB: vi.fn(),
}));

/* ──────────────────────────────────────────────────────────
 * 3.  Import the mocked modules so we can configure them
 * ────────────────────────────────────────────────────────── */
import { getPokemons }         from '@/services/pokemonDataService';
import { logSize }             from '@/utils/loggers';
import createPokemonVariants   from '@/features/variants/utils/createPokemonVariants';
import { determinePokemonKey } from '@/utils/PokemonIDUtils';
import { putBulkIntoDB }       from '@/db/instancesDB';

/* ──────────────────────────────────────────────────────────
 * 4.  Blob poly-fill for jsdom
 * ────────────────────────────────────────────────────────── */
globalThis.Blob =
  globalThis.Blob ??
  class { size = 0; constructor(_p?: unknown[]) {} };

process.env.NODE_ENV = 'development';

/* ──────────────────────────────────────────────────────────
 * 5.  Import unit under test (after mocks are ready)
 * ────────────────────────────────────────────────────────── */
import { fetchAndProcessVariants } from '@/features/variants/utils/fetchAndProcessVariants';

/* ──────────────────────────────────────────────────────────
 * 6.  Helper – expected #preload calls
 * ────────────────────────────────────────────────────────── */
const expectedPreloadCalls = variantsFixture.reduce<number>((n, v: any) => {
  if (v.currentImage) n += 1;
  if (v.type_1_icon)  n += 1;
  if (v.type_2_icon)  n += 1;
  return n;
}, 0);

/* ──────────────────────────────────────────────────────────
 * 7.  Test
 * ────────────────────────────────────────────────────────── */
describe('fetchAndProcessVariants (Vitest)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-14T12:00:00Z'));

    vi.clearAllMocks();               // reset call counts *but keep mocks*

    (getPokemons       as Mock).mockResolvedValue(pokemonApiFixture);
    (createPokemonVariants as Mock).mockReturnValue(variantsFixture);
    (determinePokemonKey  as Mock).mockImplementation(
      (v: { pokemon_id: number; variantType: string }) =>
        `${String(v.pokemon_id).padStart(4, '0')}-${v.variantType}`,
    );
    (putBulkIntoDB as Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches, processes, preloads, stores, and returns the variants', async () => {
    const result = await fetchAndProcessVariants();

    expect(result).toBe(variantsFixture);
    expect(getPokemons).toHaveBeenCalledOnce();
    expect(createPokemonVariants).toHaveBeenCalledWith(pokemonApiFixture);
    expect(determinePokemonKey).toHaveBeenCalledTimes(variantsFixture.length);
    expect(putBulkIntoDB).toHaveBeenCalledWith('pokemonVariants', variantsFixture);
    expect(preloadMock).toHaveBeenCalledTimes(expectedPreloadCalls);
    expect(localStorage.getItem('variantsTimestamp')).toBe(
      new Date('2025-06-14T12:00:00Z').getTime().toString(),
    );
  });
});
