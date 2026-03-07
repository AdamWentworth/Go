import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import BackgroundLocationCard from '@/components/pokemonComponents/BackgroundLocationCard';

describe('BackgroundLocationCard', () => {
  it('uses the background name when location is missing', () => {
    render(
      <BackgroundLocationCard
        pokemon={{
          variantType: 'default',
          backgrounds: [
            {
              background_id: 1,
              image_url: '/images/backgrounds/one.png',
              name: 'Go Fest Wormhole',
              costume_id: 0,
              date: '2024-07-13',
              location: '',
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole('button', { name: /go fest wormhole/i })).toBeInTheDocument();
    expect(screen.queryAllByText('Go Fest Wormhole').length).toBeGreaterThan(0);
  });

  it('sends the selected background and supports clearing selection', () => {
    const onSelectBackground = vi.fn();

    render(
      <BackgroundLocationCard
        pokemon={{
          variantType: 'default',
          backgrounds: [
            {
              background_id: 7,
              image_url: '/images/backgrounds/seattle.png',
              name: 'MLB Seattle Mariners',
              costume_id: 0,
              date: '2024-09-13',
              location: 'T-Mobile Park, Seattle, Washington, USA',
            },
          ],
        }}
        onSelectBackground={onSelectBackground}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /mlb seattle mariners/i }));
    expect(onSelectBackground).toHaveBeenLastCalledWith(
      expect.objectContaining({ background_id: 7 }),
    );

    fireEvent.click(screen.getByRole('button', { name: /none/i }));
    expect(onSelectBackground).toHaveBeenLastCalledWith(null);
  });
});
