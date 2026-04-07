import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TradeFilterDropdowns from '@/pages/Pokemon/features/instances/components/Trade/TradeFilterDropdowns';
import {
  EXCLUDE_IMAGES_wanted,
  INCLUDE_IMAGES_wanted,
} from '@/pages/Pokemon/features/instances/utils/constants';

const makeProps = () => ({
  isMirror: false,
  editMode: true,
  selectedExcludeImages: EXCLUDE_IMAGES_wanted.map((_, index) => index < 2),
  selectedIncludeOnlyImages: INCLUDE_IMAGES_wanted.map((_, index) => index === 0),
  toggleExcludeImageSelection: vi.fn(),
  toggleIncludeOnlyImageSelection: vi.fn(),
});

describe('TradeFilterDropdowns', () => {
  it('renders compact exclude/include triggers with active counts', () => {
    render(<TradeFilterDropdowns {...makeProps()} />);

    expect(screen.getByRole('button', { name: /Exclude/i })).toHaveTextContent('Exclude');
    expect(screen.getByRole('button', { name: /Exclude/i })).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: /Include/i })).toHaveTextContent('Include');
    expect(screen.getByRole('button', { name: /Include/i })).toHaveTextContent('1');
  });

  it('opens one filter picker at a time and closes on outside click', () => {
    render(<TradeFilterDropdowns {...makeProps()} />);

    fireEvent.click(screen.getByRole('button', { name: /Exclude/i }));
    const excludeDialog = screen.getByRole('dialog', { name: 'Exclude filters' });
    expect(within(excludeDialog).getByRole('heading', { name: 'Exclude' })).toBeInTheDocument();
    expect(within(excludeDialog).queryByRole('heading', { name: 'Include' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Include/i }));
    const includeDialog = screen.getByRole('dialog', { name: 'Include filters' });
    expect(within(includeDialog).getByRole('heading', { name: 'Include' })).toBeInTheDocument();
    expect(within(includeDialog).queryByRole('heading', { name: 'Exclude' })).not.toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('dialog', { name: 'Include filters' })).not.toBeInTheDocument();
  });

  it('renders nothing in mirror mode', () => {
    render(<TradeFilterDropdowns {...makeProps()} isMirror />);
    expect(screen.queryByRole('button', { name: /Exclude/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Include/i })).not.toBeInTheDocument();
  });
});
