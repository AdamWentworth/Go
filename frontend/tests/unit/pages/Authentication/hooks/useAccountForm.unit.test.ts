import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'react-toastify';

import useAccountForm from '@/pages/Authentication/hooks/useAccountForm';
import {
  fetchLocationOptions,
  fetchSuggestions,
} from '@/services/locationServices';
import type { User } from '@/types/auth';

vi.mock('@/services/locationServices', () => ({
  fetchSuggestions: vi.fn(),
  fetchLocationOptions: vi.fn(),
}));

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  },
}));

const mockedFetchSuggestions = vi.mocked(fetchSuggestions);
const mockedFetchLocationOptions = vi.mocked(fetchLocationOptions);

const baseUser: User = {
  user_id: 'u1',
  username: 'ash',
  email: 'ash@example.com',
  pokemonGoName: 'AshKetchum',
  trainerCode: '123412341234',
  location: 'Pallet Town',
  allowLocation: false,
  coordinates: null,
  accessTokenExpiry: '2099-01-01T00:00:00Z',
  refreshTokenExpiry: '2099-01-01T00:00:00Z',
};

describe('useAccountForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits cleaned values when editable and valid', async () => {
    const handleUpdateUserDetails = vi.fn();
    const { result } = renderHook(() =>
      useAccountForm(baseUser, handleUpdateUserDetails),
    );

    act(() => {
      result.current.handleEditToggle({
        preventDefault: vi.fn(),
      } as never);
    });

    await act(async () => {
      await result.current.handleChange({
        target: { name: 'trainerCode', value: '999988887777', type: 'text' },
      } as never);
    });

    act(() => {
      result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as never);
    });

    expect(handleUpdateUserDetails).toHaveBeenCalledTimes(1);
    const [, submission] = handleUpdateUserDetails.mock.calls[0];
    expect(submission).toMatchObject({
      trainerCode: '999988887777',
    });
    expect(submission).not.toHaveProperty('password');
    expect(submission).not.toHaveProperty('confirmPassword');
  });

  it('updates location suggestions and resets allowLocation/coordinates on location edit', async () => {
    mockedFetchSuggestions.mockResolvedValueOnce([
      {
        displayName: 'Viridian City, Kanto, Japan',
        name: 'Viridian City',
        state_or_province: 'Kanto',
        country: 'Japan',
      },
    ]);

    const userWithCoords: User = {
      ...baseUser,
      allowLocation: true,
      coordinates: { latitude: 1, longitude: 2 },
    };
    const { result } = renderHook(() =>
      useAccountForm(userWithCoords, vi.fn()),
    );

    await act(async () => {
      await result.current.handleChange({
        target: { name: 'location', value: 'Vir', type: 'text' },
      } as never);
    });

    expect(mockedFetchSuggestions).toHaveBeenCalledWith('Vir');
    expect(result.current.values.allowLocation).toBe(false);
    expect(result.current.values.coordinates).toBeNull();
    expect(result.current.suggestions).toHaveLength(1);
  });

  it('handles geolocation success and opens location options overlay', async () => {
    mockedFetchLocationOptions.mockResolvedValueOnce([
      {
        displayName: 'Pallet Town, Kanto, Japan',
        name: 'Pallet Town',
        state_or_province: 'Kanto',
        country: 'Japan',
      },
    ]);

    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: {
          latitude: 35.68,
          longitude: 139.69,
        },
      } as GeolocationPosition);
    });
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true,
    });

    const { result } = renderHook(() => useAccountForm(baseUser, vi.fn()));

    await act(async () => {
      await result.current.handleAllowLocationChange({
        target: { checked: true },
      } as never);
    });

    await waitFor(() => {
      expect(result.current.showOptionsOverlay).toBe(true);
      expect(result.current.locationOptions).toHaveLength(1);
      expect(result.current.values.coordinates).toEqual({
        latitude: 35.68,
        longitude: 139.69,
      });
    });
  });

  it('shows toast error when geolocation callback returns error', async () => {
    const getCurrentPosition = vi.fn(
      (_success: PositionCallback, error?: PositionErrorCallback) => {
        error?.({
          message: 'denied',
        } as GeolocationPositionError);
      },
    );
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true,
    });

    const { result } = renderHook(() => useAccountForm(baseUser, vi.fn()));

    await act(async () => {
      await result.current.handleAllowLocationChange({
        target: { checked: true },
      } as never);
    });

    expect(toast.error).toHaveBeenCalledWith(
      'Unable to fetch your current location. Please enable location permissions.',
    );
  });
});
