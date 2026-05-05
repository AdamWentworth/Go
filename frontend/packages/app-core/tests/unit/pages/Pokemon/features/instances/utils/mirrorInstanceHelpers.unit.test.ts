import { describe, expect, it, vi } from 'vitest';

import {
  getPokemonIdFromMirrorVariant,
  normalizeMirrorVariantId,
  safeUpdateMirrorDetails,
} from '@/pages/Pokemon/features/instances/utils/mirrorInstanceHelpers';
import type { PokemonInstance } from '@/types/pokemonInstance';

describe('mirrorInstanceHelpers', () => {
  describe('normalizeMirrorVariantId', () => {
    it('normalizes legacy hyphenated suffixes and case', () => {
      expect(normalizeMirrorVariantId('0006-shiny-gigantamax')).toBe('0006-shiny_gigantamax');
      expect(normalizeMirrorVariantId('0006-SHINY')).toBe('0006-shiny');
      expect(normalizeMirrorVariantId('0006')).toBe('0006');
    });

    it('returns undefined for empty or missing variant ids', () => {
      expect(normalizeMirrorVariantId(undefined)).toBeUndefined();
      expect(normalizeMirrorVariantId(null)).toBeUndefined();
      expect(normalizeMirrorVariantId('')).toBeUndefined();
    });
  });

  describe('getPokemonIdFromMirrorVariant', () => {
    it('extracts the pokedex id from canonical and legacy variant ids', () => {
      expect(getPokemonIdFromMirrorVariant('0006-shiny_gigantamax')).toBe(6);
      expect(getPokemonIdFromMirrorVariant('025-default')).toBe(25);
    });

    it('returns undefined when no numeric prefix exists', () => {
      expect(getPokemonIdFromMirrorVariant(undefined)).toBeUndefined();
      expect(getPokemonIdFromMirrorVariant('missing-default')).toBeUndefined();
    });
  });

  describe('safeUpdateMirrorDetails', () => {
    it('supports id/data updateDetails functions', () => {
      const calls: Array<[string, Partial<PokemonInstance>]> = [];
      function updateDetails(id: string, data: Partial<PokemonInstance>): void {
        calls.push([id, data]);
      }

      safeUpdateMirrorDetails(updateDetails, 'source-1', { mirror: true });

      expect(calls).toEqual([['source-1', { mirror: true }]]);
    });

    it('supports patch-map updateDetails functions', () => {
      const calls: Array<Record<string, Partial<PokemonInstance>>> = [];
      function updateDetails(patch: Record<string, Partial<PokemonInstance>>): void {
        calls.push(patch);
      }

      safeUpdateMirrorDetails(updateDetails, 'source-1', { mirror: false });

      expect(calls).toEqual([{ 'source-1': { mirror: false } }]);
    });

    it('allows missing updateDetails when callers only need in-memory updates', () => {
      expect(() => {
        safeUpdateMirrorDetails(undefined, 'source-1', { mirror: true });
      }).not.toThrow();
    });

    it('reports updateDetails errors without throwing', () => {
      const onError = vi.fn();
      const error = new Error('boom');
      function updateDetails(): void {
        throw error;
      }

      expect(() =>
        safeUpdateMirrorDetails(updateDetails, 'source-1', { mirror: true }, onError),
      ).not.toThrow();
      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
