import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import LocationCaught from '@/components/pokemonComponents/LocationCaught';

const fetchSuggestionsMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/locationServices', () => ({
  fetchSuggestions: fetchSuggestionsMock,
}));

describe('LocationCaught', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a controlled text input in edit mode and preserves typing order', async () => {
    const onLocationChange = vi.fn();
    fetchSuggestionsMock.mockResolvedValue([]);

    render(
      <LocationCaught
        pokemon={{ instanceData: { location_caught: '' } }}
        editMode={true}
        onLocationChange={onLocationChange}
      />,
    );

    const input = screen.getByLabelText('Location Caught:');
    fireEvent.change(input, { target: { value: 'Seattle, Washington' } });

    expect(input).toHaveValue('Seattle, Washington');
    expect(onLocationChange).toHaveBeenLastCalledWith('Seattle, Washington');
  });

  it('shows and applies location suggestions', async () => {
    const onLocationChange = vi.fn();
    fetchSuggestionsMock.mockResolvedValue([{ displayName: 'Seattle, Washington, USA' }]);

    render(
      <LocationCaught
        pokemon={{ instanceData: { location_caught: '' } }}
        editMode={true}
        onLocationChange={onLocationChange}
      />,
    );

    const input = screen.getByLabelText('Location Caught:');
    fireEvent.change(input, { target: { value: 'Seat' } });

    await waitFor(() => {
      expect(screen.getByText('Seattle, Washington, USA')).toBeInTheDocument();
    });

    fireEvent.mouseDown(screen.getByText('Seattle, Washington, USA'));

    expect(input).toHaveValue('Seattle, Washington, USA');
    expect(onLocationChange).toHaveBeenLastCalledWith('Seattle, Washington, USA');
  });

  it('does not auto-focus the input when edit mode is enabled', () => {
    render(
      <LocationCaught
        pokemon={{ instanceData: { location_caught: 'Seattle, Washington' } }}
        editMode={true}
        onLocationChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText('Location Caught:');
    expect(input).not.toHaveFocus();
  });

  it('renders nothing when not editing and there is no saved location', () => {
    const { container } = render(
      <LocationCaught
        pokemon={{ instanceData: { location_caught: '' } }}
        editMode={false}
        onLocationChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
