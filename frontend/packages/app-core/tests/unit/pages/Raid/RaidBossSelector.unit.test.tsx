import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import RaidBossSelector from '@/pages/Raid/RaidBossSelector';

describe('RaidBossSelector', () => {
  it('renders input, label, and datalist options', () => {
    const bosses = [
      { id: 1, name: 'Mewtwo' },
      { id: 2, name: 'Rayquaza' },
    ];

    const { container } = render(
      <RaidBossSelector
        searchTerm="Mew"
        handleInputChange={vi.fn()}
        filteredRaidBosses={bosses}
      />,
    );

    const input = screen.getByLabelText('Select or Type Raid Boss:');
    expect(input).toHaveValue('Mew');
    expect(input).toHaveAttribute('list', 'raid-boss-options');
    const options = Array.from(container.querySelectorAll('datalist option')).map((option) =>
      option.getAttribute('value'),
    );
    expect(options).toEqual(['Mewtwo', 'Rayquaza']);
  });

  it('calls change handler when typing', () => {
    const handleInputChange = vi.fn();

    render(
      <RaidBossSelector
        searchTerm=""
        handleInputChange={handleInputChange}
        filteredRaidBosses={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText('Select or Type Raid Boss:'), {
      target: { value: 'Groudon' },
    });

    expect(handleInputChange).toHaveBeenCalledTimes(1);
  });
});
