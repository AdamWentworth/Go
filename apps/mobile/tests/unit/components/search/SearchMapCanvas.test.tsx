import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SearchMapCanvas } from '../../../../src/components/search/SearchMapCanvas';
import type { SearchMapPoint } from '../../../../src/features/search/searchMapModels';

const buildPoint = (
  markerId: string,
  latitude: number,
  longitude: number,
): SearchMapPoint => ({
  markerId,
  resultIndex: Number(markerId.replace('marker-', '')) - 1,
  pokemonId: 25,
  username: 'misty',
  latitude,
  longitude,
  row: { pokemon_id: 25, latitude, longitude, username: 'misty' },
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
});
