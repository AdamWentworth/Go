import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePokemonDetails } from '@/pages/Trades/hooks/usePokemonDetails';

describe('usePokemonDetails', () => {
  it('resolves variant details using instance.variant_id for UUID instance IDs', async () => {
    const variants = [
      {
        variant_id: '0006-default',
        pokemon_id: 6,
        name: 'Charizard',
        currentImage: '/images/default/pokemon_6.png',
        moves: [],
      },
      {
        variant_id: '0006-shiny',
        pokemon_id: 6,
        name: 'Charizard',
        currentImage: '/images/shiny/shiny_pokemon_6.png',
        moves: [{ move_id: 1, name: 'Fire Spin', type: 'fire', type_name: 'Fire' }],
      },
    ];

    const relatedInstances = {
      '550e8400-e29b-41d4-a716-446655440000': {
        instance_id: '550e8400-e29b-41d4-a716-446655440000',
        variant_id: '0006-shiny',
        pokemon_id: 6,
      },
    };
    const ownershipData = {};

    const { result } = renderHook(() =>
      usePokemonDetails(
        '550e8400-e29b-41d4-a716-446655440000',
        variants as any,
        relatedInstances,
        ownershipData,
      ),
    );

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current?.variant_id).toBe('0006-shiny');
    expect(result.current?.currentImage).toBe('/images/shiny/shiny_pokemon_6.png');
    expect(Array.isArray(result.current?.moves)).toBe(true);
  });

  it('falls back to legacy parsed key when variant_id is absent', async () => {
    const instanceId = '0001-default_550e8400-e29b-41d4-a716-446655440000';
    const variants = [
      {
        variant_id: '0001-default',
        pokemon_id: 1,
        name: 'Bulbasaur',
        currentImage: '/images/default/pokemon_1.png',
      },
    ];

    const relatedInstances = {};
    const ownershipData = {};

    const { result } = renderHook(() =>
      usePokemonDetails(instanceId, variants as any, relatedInstances, ownershipData),
    );

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current?.variant_id).toBe('0001-default');
    expect(result.current?.currentImage).toBe('/images/default/pokemon_1.png');
  });

  it('provides a safe empty moves list when no moves are available', async () => {
    const variants = [
      {
        variant_id: '0025-default',
        pokemon_id: 25,
        name: 'Pikachu',
        currentImage: '/images/default/pokemon_25.png',
      },
    ];

    const relatedInstances = {
      abc: {
        instance_id: 'abc',
        variant_id: '0025-default',
        pokemon_id: 25,
      },
    };
    const ownershipData = {};

    const { result } = renderHook(() =>
      usePokemonDetails('abc', variants as any, relatedInstances, ownershipData),
    );

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(Array.isArray(result.current?.moves)).toBe(true);
    expect(result.current?.moves).toHaveLength(0);
  });
});
