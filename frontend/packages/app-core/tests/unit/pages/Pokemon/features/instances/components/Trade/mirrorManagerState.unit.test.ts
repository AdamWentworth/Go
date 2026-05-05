import { describe, expect, it, vi } from 'vitest';

import {
  buildMirrorTooltipHtml,
  enrichMirrorInstanceForDisplay,
  findExistingMirrorKey,
  getMirrorVariantId,
  type MirrorPokemon,
} from '@/pages/Pokemon/features/instances/components/Trade/mirrorManagerState';
import type { PokemonInstance } from '@/types/pokemonInstance';

const makeInstance = (overrides: Partial<PokemonInstance> = {}): PokemonInstance =>
  ({
    instance_id: 'mirror-1',
    variant_id: '0001-default',
    pokemon_id: 1,
    is_wanted: true,
    is_caught: false,
    is_for_trade: false,
    ...overrides,
  } as PokemonInstance);

const makePokemon = (overrides: Partial<MirrorPokemon> = {}): MirrorPokemon => ({
  variant_id: '0001-default',
  pokemon_id: 1,
  species_name: 'Bulbasaur',
  name: 'Bulbasaur',
  currentImage: '/images/bulbasaur.png',
  variantType: 'default',
  ...overrides,
});

describe('mirrorManagerState', () => {
  describe('getMirrorVariantId', () => {
    it('falls back to the source instance variant id', () => {
      expect(
        getMirrorVariantId(
          makePokemon({
            variant_id: undefined,
            instanceData: { variant_id: '0006-shiny-gigantamax' },
          }),
        ),
      ).toBe('0006-shiny_gigantamax');
    });
  });

  describe('findExistingMirrorKey', () => {
    it('returns an existing wanted-only mirror for the normalized variant id', () => {
      const onResolved = vi.fn();

      const result = findExistingMirrorKey({
        pokemon: makePokemon({ variant_id: '0006-shiny-gigantamax', pokemon_id: '6' }),
        instanceMap: {
          ignored: makeInstance({
            instance_id: 'ignored',
            variant_id: '0006-default',
            pokemon_id: 6,
          }),
          'mirror-6': makeInstance({
            instance_id: 'mirror-6',
            variant_id: '0006-shiny_gigantamax',
            pokemon_id: 6,
          }),
        },
        onResolved,
      });

      expect(result).toBe('mirror-6');
      expect(onResolved).toHaveBeenCalledWith('mirror-6', '0006-shiny_gigantamax');
    });

    it('ignores caught, for-trade, and mismatched species instances', () => {
      const result = findExistingMirrorKey({
        pokemon: makePokemon({ variant_id: '0006-default', pokemon_id: 6 }),
        instanceMap: {
          caught: makeInstance({
            instance_id: 'caught',
            variant_id: '0006-default',
            pokemon_id: 6,
            is_caught: true,
          }),
          trade: makeInstance({
            instance_id: 'trade',
            variant_id: '0006-default',
            pokemon_id: 6,
            is_for_trade: true,
          }),
          species: makeInstance({
            instance_id: 'species',
            variant_id: '0006-default',
            pokemon_id: 7,
          }),
        },
      });

      expect(result).toBeUndefined();
    });

    it('warns and skips matching when the source has no variant id', () => {
      const onMissingVariant = vi.fn();
      const onResolved = vi.fn();

      const result = findExistingMirrorKey({
        pokemon: makePokemon({ variant_id: undefined, instanceData: undefined }),
        instanceMap: {
          'mirror-1': makeInstance(),
        },
        onMissingVariant,
        onResolved,
      });

      expect(result).toBeUndefined();
      expect(onMissingVariant).toHaveBeenCalledWith(
        expect.objectContaining({ species_name: 'Bulbasaur' }),
      );
      expect(onResolved).not.toHaveBeenCalled();
    });
  });

  it('enriches mirror instances with display fields from the source pokemon', () => {
    expect(
      enrichMirrorInstanceForDisplay(
        makeInstance({ instance_id: 'mirror-1' }),
        makePokemon({
          currentImage: '/images/variant.png',
          pokedex_number: '1',
          date_available: '2020-01-01',
          rarity: 'common',
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        instance_id: 'mirror-1',
        currentImage: '/images/variant.png',
        name: 'Bulbasaur',
        pokedex_number: 1,
        date_available: '2020-01-01',
        rarity: 'common',
      }),
    );
  });

  it('builds tooltip copy from the display name with a fallback', () => {
    expect(buildMirrorTooltipHtml(makePokemon())).toContain('<b><u>Bulbasaur</u></b>');
    expect(
      buildMirrorTooltipHtml(makePokemon({ species_name: undefined, name: undefined })),
    ).toContain('<b><u>this Pokemon</u></b>');
  });
});
