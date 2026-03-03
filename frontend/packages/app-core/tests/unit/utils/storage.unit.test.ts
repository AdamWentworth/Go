import { beforeEach, describe, expect, it } from 'vitest';

import {
  getStorageBoolean,
  getStorageJson,
  getStorageNumber,
  getStoredLocation,
  getStoredUser,
  getStoredUsername,
  removeStorageKeys,
  setStorageBoolean,
  setStorageJson,
  setStorageNumber,
  setStoredLocation,
  setStoredUser,
  STORAGE_KEYS,
} from '@/utils/storage';

describe('storage utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null for malformed JSON payloads', () => {
    localStorage.setItem(STORAGE_KEYS.user, '{bad-json');
    expect(getStorageJson(STORAGE_KEYS.user)).toBeNull();
  });

  it('reads stored username from lightweight user records', () => {
    setStorageJson(STORAGE_KEYS.user, { username: 'Ash' });
    expect(getStoredUsername()).toBe('Ash');
  });

  it('requires session fields for strict stored user retrieval', () => {
    setStorageJson(STORAGE_KEYS.user, { username: 'Ash' });
    expect(getStoredUser()).toBeNull();

    setStoredUser({
      user_id: 'u-1',
      username: 'Ash',
      email: 'ash@example.com',
      pokemonGoName: 'Ash Ketchum',
      trainerCode: '1234 5678 9012',
      location: 'Pallet Town',
      allowLocation: false,
      coordinates: null,
      accessTokenExpiry: '2099-01-01T00:00:00Z',
      refreshTokenExpiry: '2099-01-02T00:00:00Z',
    });

    expect(getStoredUser()).toMatchObject({
      user_id: 'u-1',
      username: 'Ash',
    });
  });

  it('parses stored location with numeric coercion and rejects invalid values', () => {
    localStorage.setItem(
      STORAGE_KEYS.location,
      JSON.stringify({ latitude: '35.68', longitude: '-120.11' }),
    );
    expect(getStoredLocation()).toEqual({
      latitude: 35.68,
      longitude: -120.11,
    });

    localStorage.setItem(
      STORAGE_KEYS.location,
      JSON.stringify({ latitude: 'abc', longitude: 2 }),
    );
    expect(getStoredLocation()).toBeNull();

    setStoredLocation({ latitude: 1, longitude: 2 });
    expect(getStoredLocation()).toEqual({ latitude: 1, longitude: 2 });
  });

  it('handles boolean and numeric storage helpers with safe fallbacks', () => {
    expect(getStorageBoolean(STORAGE_KEYS.isLightMode, false)).toBe(false);
    setStorageBoolean(STORAGE_KEYS.isLightMode, true);
    expect(getStorageBoolean(STORAGE_KEYS.isLightMode, false)).toBe(true);

    localStorage.setItem(STORAGE_KEYS.isLightMode, 'false');
    expect(getStorageBoolean(STORAGE_KEYS.isLightMode, true)).toBe(false);

    setStorageNumber(STORAGE_KEYS.ownershipTimestamp, 1234);
    expect(getStorageNumber(STORAGE_KEYS.ownershipTimestamp, 0)).toBe(1234);

    localStorage.setItem(STORAGE_KEYS.ownershipTimestamp, 'NaN');
    expect(getStorageNumber(STORAGE_KEYS.ownershipTimestamp, 77)).toBe(77);
  });

  it('removes multiple keys atomically via removeStorageKeys', () => {
    setStorageJson(STORAGE_KEYS.user, { username: 'Ash' });
    setStorageJson(STORAGE_KEYS.location, { latitude: 1, longitude: 2 });
    setStorageJson(STORAGE_KEYS.pokemonOwnership, { cache: true });

    removeStorageKeys([
      STORAGE_KEYS.user,
      STORAGE_KEYS.location,
      STORAGE_KEYS.pokemonOwnership,
    ]);

    expect(localStorage.getItem(STORAGE_KEYS.user)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.location)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.pokemonOwnership)).toBeNull();
  });
});

