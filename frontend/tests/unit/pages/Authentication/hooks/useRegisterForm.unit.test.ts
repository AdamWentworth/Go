import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'react-toastify';

import useRegisterForm from '@/pages/Authentication/hooks/useRegisterForm';
import {
  fetchLocationOptions,
  fetchSuggestions,
} from '@/services/locationServices';

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

describe('useRegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setInput = async (
    handler: (event: never) => Promise<void>,
    name: string,
    value: string,
  ) => {
    await act(async () => {
      await handler({
        target: { name, value, type: 'text' },
      } as never);
    });
  };

  it('submits sanitized values when form is valid', async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useRegisterForm(onSubmit));

    await setInput(result.current.handleInputChange, 'username', 'Ash_Ketchum');
    await setInput(result.current.handleInputChange, 'email', 'ash@example.com');
    await setInput(result.current.handleInputChange, 'password', 'StrongPass1!');
    await setInput(result.current.handleInputChange, 'locationInput', 'Pallet Town');

    act(() => {
      result.current.handleCheckboxChange({
        target: { name: 'pokemonGoNameDisabled', checked: true },
      } as never);
    });

    act(() => {
      result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'Ash_Ketchum',
        email: 'ash@example.com',
        password: 'StrongPass1!',
        pokemonGoName: 'Ash_Ketchum',
        location: 'Pallet Town',
      }),
    );
  });

  it('blocks submit and sets validation errors for invalid input', async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useRegisterForm(onSubmit));

    await setInput(result.current.handleInputChange, 'username', 'bad name');
    await setInput(result.current.handleInputChange, 'email', 'ash@example.com');
    await setInput(result.current.handleInputChange, 'password', 'StrongPass1!');

    act(() => {
      result.current.handleSubmit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.errors.username).toContain('cannot contain spaces');
  });

  it('fetches suggestions for location input > 2 characters', async () => {
    mockedFetchSuggestions.mockResolvedValueOnce([
      {
        displayName: 'Pallet Town, Kanto, Japan',
        name: 'Pallet Town',
        state_or_province: 'Kanto',
        country: 'Japan',
      },
    ]);
    const { result } = renderHook(() => useRegisterForm(vi.fn()));

    await act(async () => {
      await result.current.handleInputChange({
        target: { name: 'locationInput', value: 'Pal', type: 'text' },
      } as never);
    });

    expect(mockedFetchSuggestions).toHaveBeenCalledWith('Pal');
    expect(result.current.suggestions).toHaveLength(1);

    await act(async () => {
      await result.current.handleInputChange({
        target: { name: 'locationInput', value: 'Pa', type: 'text' },
      } as never);
    });

    expect(result.current.suggestions).toHaveLength(0);
  });

  it('handles geolocation success and populates location options overlay', async () => {
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

    const { result } = renderHook(() => useRegisterForm(vi.fn()));

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

  it('shows toast error when geolocation returns an error', async () => {
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

    const { result } = renderHook(() => useRegisterForm(vi.fn()));

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
