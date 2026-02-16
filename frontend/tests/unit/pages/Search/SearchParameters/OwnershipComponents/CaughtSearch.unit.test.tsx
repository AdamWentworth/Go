import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import CaughtSearch from '@/pages/Search/SearchParameters/OwnershipComponents/CaughtSearch';

const ivMock = vi.fn();

vi.mock('@/components/pokemonComponents/IV', () => ({
  default: (props: unknown) => {
    ivMock(props);
    return <div data-testid="iv-component" />;
  },
}));

describe('CaughtSearch', () => {
  it('forwards IV props to IV component in search mode', () => {
    render(
      <CaughtSearch
        ivs={{ Attack: 1, Defense: 2, Stamina: 3 }}
        onIvChange={vi.fn()}
        isHundo={false}
        setIsHundo={vi.fn()}
      />,
    );

    expect(screen.getByTestId('iv-component')).toBeInTheDocument();
    const latestProps = ivMock.mock.calls.at(-1)?.[0] as { mode?: string };
    expect(latestProps.mode).toBe('search');
  });
});
