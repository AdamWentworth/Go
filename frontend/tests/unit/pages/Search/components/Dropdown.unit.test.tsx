import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import Dropdown from '@/pages/Search/components/Dropdown';

describe('Dropdown', () => {
  it('renders label, default option, and formatted options', () => {
    render(
      <Dropdown
        label="Costume"
        value=""
        options={['event', 'classic']}
        handleChange={vi.fn()}
        formatLabel={(value) => String(value).toUpperCase()}
      />,
    );

    expect(screen.getByText('Costume:')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'None' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'EVENT' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'CLASSIC' })).toBeInTheDocument();
  });

  it('calls handleChange when selection changes', () => {
    const handleChange = vi.fn();

    const Harness = () => {
      const [value, setValue] = React.useState<string>('');

      return (
        <Dropdown
          label="Form"
          value={value}
          options={['normal', 'shadow']}
          handleChange={(event) => {
            handleChange(event);
            setValue(event.target.value);
          }}
        />
      );
    };

    render(<Harness />);

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'shadow' },
    });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('combobox')).toHaveValue('shadow');
  });
});
