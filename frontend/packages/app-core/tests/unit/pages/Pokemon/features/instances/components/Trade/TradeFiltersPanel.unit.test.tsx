import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TradeFiltersPanel from '@/pages/Pokemon/features/instances/components/Trade/TradeFiltersPanel';
import {
  EXCLUDE_IMAGES_wanted,
  INCLUDE_IMAGES_wanted,
} from '@/pages/Pokemon/features/instances/utils/constants';

const makeProps = () => ({
  isMirror: false,
  shouldShowFewLayout: false,
  editMode: true,
  selectedExcludeImages: EXCLUDE_IMAGES_wanted.map(() => true),
  selectedIncludeOnlyImages: INCLUDE_IMAGES_wanted.map(() => true),
  toggleExcludeImageSelection: vi.fn(),
  toggleIncludeOnlyImageSelection: vi.fn(),
});

describe('TradeFiltersPanel', () => {
  it('renders nothing when mirror mode is enabled', () => {
    render(<TradeFiltersPanel {...makeProps()} isMirror />);
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('renders exclude and include rows in both layouts', () => {
    const { rerender } = render(
      <TradeFiltersPanel {...makeProps()} shouldShowFewLayout={false} />,
    );
    expect(screen.getByRole('heading', { name: 'Exclude' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Require' })).toBeInTheDocument();

    rerender(<TradeFiltersPanel {...makeProps()} shouldShowFewLayout />);
    expect(screen.getByRole('heading', { name: 'Exclude' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Require' })).toBeInTheDocument();
  });

  it('forwards image clicks to both exclude and include toggles', () => {
    const props = makeProps();
    const { container } = render(<TradeFiltersPanel {...props} />);

    const excludeImage = container.querySelector('.trade-filter-group--exclude img');
    const includeImage = container.querySelector('.trade-filter-group--include img');

    expect(excludeImage).toBeTruthy();
    expect(includeImage).toBeTruthy();

    fireEvent.click(excludeImage as HTMLImageElement);
    fireEvent.click(includeImage as HTMLImageElement);

    expect(props.toggleExcludeImageSelection).toHaveBeenCalledWith(0, true);
    expect(props.toggleIncludeOnlyImageSelection).toHaveBeenCalledWith(0, true);
  });

  it('can render a single filter group for dropdown mode', () => {
    const { rerender } = render(<TradeFiltersPanel {...makeProps()} mode="exclude" />);
    expect(screen.getByRole('heading', { name: 'Exclude' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Require' })).not.toBeInTheDocument();

    rerender(<TradeFiltersPanel {...makeProps()} mode="include" />);
    expect(screen.getByRole('heading', { name: 'Require' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Exclude' })).not.toBeInTheDocument();
  });
});
