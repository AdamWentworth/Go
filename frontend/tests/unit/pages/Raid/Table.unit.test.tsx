import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import Table from '@/pages/Raid/Table';

describe('Raid Table', () => {
  it('renders headers and table rows', () => {
    const moves = [
      {
        name: 'Mewtwo',
        fastMove: 'Psycho Cut',
        chargedMove: 'Psystrike',
        dps: 23.4,
        tdo: '---',
        er: '---',
        cp: '4724',
      },
      {
        name: 'Rayquaza',
        fastMove: 'Dragon Tail',
        chargedMove: 'Breaking Swipe',
        dps: 21.2,
        tdo: '---',
        er: '---',
        cp: '4336',
      },
    ];

    render(<Table moves={moves} />);

    expect(screen.getByRole('columnheader', { name: 'Pokemon' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Fast Move' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Charged Move' })).toBeInTheDocument();
    expect(screen.getByText('Mewtwo')).toBeInTheDocument();
    expect(screen.getByText('Psystrike')).toBeInTheDocument();
    expect(screen.getByText('Rayquaza')).toBeInTheDocument();
    expect(screen.getByText('Breaking Swipe')).toBeInTheDocument();
  });

  it('renders only header row for empty data', () => {
    const { container } = render(<Table moves={[]} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(0);
  });
});

