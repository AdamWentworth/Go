import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Level from '@/components/pokemonComponents/Level';

describe('Level', () => {
  it('shows an explicit missing value outside edit mode', () => {
    render(<Level editMode={false} level={null} onLevelChange={vi.fn()} />);

    expect(screen.getByText('Level:')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('keeps the input available when editing an instance without a level', () => {
    const onLevelChange = vi.fn();
    render(
      <Level editMode={true} level={null} onLevelChange={onLevelChange} />,
    );

    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(null);

    fireEvent.change(input, { target: { value: '40.5' } });
    expect(onLevelChange).toHaveBeenCalledWith('40.5');
  });
});
