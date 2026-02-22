import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SearchMapCanvas } from '../../../../src/components/search/SearchMapCanvas';
import type { SearchMapPoint } from '../../../../src/features/search/searchMapModels';

const buildPoint = (
  markerId: string,
  latitude: number,
  longitude: number,
  username = 'misty',
  pokemonId = 25,
): SearchMapPoint => ({
  markerId,
  resultIndex: Number(markerId.replace('marker-', '')) - 1,
  pokemonId,
  username,
  latitude,
  longitude,
  row: { pokemon_id: pokemonId, latitude, longitude, username },
});

describe('SearchMapCanvas', () => {
  it('shows empty state when no points exist', () => {
    render(<SearchMapCanvas points={[]} selectedMarkerId={null} onSelect={jest.fn()} />);
    expect(screen.getByText('No coordinate points available for map preview.')).toBeTruthy();
  });

  it('renders markers and forwards marker selection', () => {
    const onSelect = jest.fn();
    const points = [buildPoint('marker-1', 10, 20), buildPoint('marker-2', 11, 21)];

    render(<SearchMapCanvas points={points} selectedMarkerId={null} onSelect={onSelect} />);

    fireEvent.press(screen.getByLabelText('Map marker #2'));
    expect(onSelect).toHaveBeenCalledWith('marker-2');
  });

  it('shows popup with pokemon id and username when a marker is selected', () => {
    const points = [buildPoint('marker-1', 10, 20, 'ash', 25)];

    render(
      <SearchMapCanvas
        points={points}
        selectedMarkerId="marker-1"
        onSelect={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Map marker popup')).toBeTruthy();
    expect(screen.getByText('#25')).toBeTruthy();
    expect(screen.getByText('ash')).toBeTruthy();
  });

  it('shows ownership mode in popup when provided', () => {
    const points = [buildPoint('marker-1', 10, 20, 'brock', 1)];

    render(
      <SearchMapCanvas
        points={points}
        selectedMarkerId="marker-1"
        onSelect={jest.fn()}
        ownershipMode="trade"
      />,
    );

    expect(screen.getByText('trade')).toBeTruthy();
  });

  it('does not show popup when no marker is selected', () => {
    const points = [buildPoint('marker-1', 10, 20, 'ash', 25)];

    render(
      <SearchMapCanvas points={points} selectedMarkerId={null} onSelect={jest.fn()} />,
    );

    expect(screen.queryByLabelText('Map marker popup')).toBeNull();
  });

  it('does not show popup for a markerId that is not in the points list', () => {
    const points = [buildPoint('marker-1', 10, 20)];

    render(
      <SearchMapCanvas
        points={points}
        selectedMarkerId="marker-99"
        onSelect={jest.fn()}
      />,
    );

    expect(screen.queryByLabelText('Map marker popup')).toBeNull();
  });
});
