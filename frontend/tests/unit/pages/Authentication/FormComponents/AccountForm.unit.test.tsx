import React, { createRef } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, within } from '@testing-library/react';

import AccountForm, { type AccountFormHandle } from '@/pages/Authentication/FormComponents/AccountForm';
import type { User } from '@/types/auth';
import useAccountForm from '@/pages/Authentication/hooks/useAccountForm';

vi.mock('@/pages/Authentication/hooks/useAccountForm', () => ({
  default: vi.fn(),
}));

vi.mock('@/pages/Authentication/CoordinateSelector', () => ({
  default: () => <div data-testid="coordinate-selector" />,
}));

vi.mock('@/pages/Authentication/LocationOptionsOverlay', () => ({
  default: () => <div data-testid="location-options-overlay" />,
}));

const mockedUseAccountForm = vi.mocked(useAccountForm);

const baseUser: User = {
  user_id: 'u1',
  username: 'ash',
  email: 'ash@example.com',
  pokemonGoName: 'AshKetchum',
  trainerCode: '1234-5678-9012',
  location: 'Pallet Town',
  allowLocation: true,
  coordinates: { latitude: 0, longitude: 0 },
  accessTokenExpiry: '2099-01-01T00:00:00Z',
  refreshTokenExpiry: '2099-01-01T00:00:00Z',
};

beforeEach(() => {
  mockedUseAccountForm.mockReturnValue({
    values: {
      userId: 'u1',
      username: 'ash',
      email: 'ash@example.com',
      password: '',
      confirmPassword: '',
      pokemonGoName: 'AshKetchum',
      pokemonGoNameDisabled: false,
      trainerCode: '1234-5678-9012',
      allowLocation: true,
      location: 'Pallet Town',
      coordinates: { latitude: 0, longitude: 0 },
      accessTokenExpiry: '2099-01-01T00:00:00Z',
      refreshTokenExpiry: '2099-01-01T00:00:00Z',
    },
    errors: {},
    handleChange: vi.fn(),
    handleSubmit: vi.fn((e?: React.SyntheticEvent) => e?.preventDefault()),
    isEditable: false,
    handleEditToggle: vi.fn(),
    isMapVisible: false,
    setIsMapVisible: vi.fn(),
    showOptionsOverlay: false,
    setShowOptionsOverlay: vi.fn(),
    selectedCoordinates: null,
    prevCoordinates: null,
    handleCoordinatesSelect: vi.fn(),
    handleLocationUpdate: vi.fn(),
    handleOverlayLocationSelect: vi.fn(),
    handleAllowLocationChange: vi.fn(),
    handleLocationInputFocus: vi.fn(),
    handleLocationInputBlur: vi.fn(),
    suggestions: [],
    selectSuggestion: vi.fn(),
    locationOptions: [],
    showLocationWarning: false,
    setErrors: vi.fn(),
    clearManualCoordinates: vi.fn(),
    resetForm: vi.fn(),
  } as ReturnType<typeof useAccountForm>);
});

describe('AccountForm', () => {
  it('renders login prompt when user is null', () => {
    const view = render(
      <AccountForm
        ref={createRef<AccountFormHandle>()}
        user={null}
        handleUpdateUserDetails={vi.fn()}
        onLogout={vi.fn()}
        onDeleteAccount={vi.fn()}
      />,
    );

    expect(within(view.container).getByText('Please log in to view and edit account details.')).toBeInTheDocument();
  });

  it('supports transition from authenticated view to null user without hook-order errors', () => {
    const props = {
      handleUpdateUserDetails: vi.fn(),
      onLogout: vi.fn(),
      onDeleteAccount: vi.fn(),
    };
    const view = render(
      <AccountForm
        ref={createRef<AccountFormHandle>()}
        user={baseUser}
        {...props}
      />,
    );

    expect(within(view.container).getByText('Account Details')).toBeInTheDocument();

    expect(() => {
      view.rerender(
        <AccountForm
          ref={createRef<AccountFormHandle>()}
          user={null}
          {...props}
        />,
      );
    }).not.toThrow();

    expect(within(view.container).getByText('Please log in to view and edit account details.')).toBeInTheDocument();
  });
});
