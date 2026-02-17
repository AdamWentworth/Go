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

  it('renders compact layout include heading only in few-layout mode', () => {
    const { rerender } = render(
      <TradeFiltersPanel {...makeProps()} shouldShowFewLayout={false} />,
    );
    expect(screen.queryByRole('heading', { name: 'Include' })).not.toBeInTheDocument();

    rerender(<TradeFiltersPanel {...makeProps()} shouldShowFewLayout />);
    expect(screen.getByRole('heading', { name: 'Include' })).toBeInTheDocument();
  });

  it('forwards image clicks to both exclude and include toggles', () => {
    const props = makeProps();
    const { container } = render(<TradeFiltersPanel {...props} />);

    const excludeImage = container.querySelector('.exclude-header-group img');
    const includeImage = container.querySelector('.include-only-header-group img');

    expect(excludeImage).toBeTruthy();
    expect(includeImage).toBeTruthy();

    fireEvent.click(excludeImage as HTMLImageElement);
    fireEvent.click(includeImage as HTMLImageElement);

    expect(props.toggleExcludeImageSelection).toHaveBeenCalledWith(0, true);
    expect(props.toggleIncludeOnlyImageSelection).toHaveBeenCalledWith(0, true);
  });
});
