import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import VariantSearchTogglePanel from '@/pages/Search/SearchParameters/VariantSearchTogglePanel';

vi.mock('@/pages/Search/components/Dropdown', () => ({
  default: ({ label }: { label: string }) => <div data-testid={`dropdown-${label}`} />,
}));

describe('VariantSearchTogglePanel', () => {
  it('forwards shiny/costume/shadow toggle callbacks', () => {
    const onShinyToggle = vi.fn();
    const onCostumeToggle = vi.fn();
    const onShadowToggle = vi.fn();

    render(
      <VariantSearchTogglePanel
        isShiny={false}
        isShadow={false}
        showCostumeDropdown={false}
        onShinyToggle={onShinyToggle}
        onCostumeToggle={onCostumeToggle}
        onShadowToggle={onShadowToggle}
        availableForms={[]}
        selectedForm=""
        onFormChange={vi.fn()}
        availableCostumeNames={[]}
        costume=""
        onCostumeChange={vi.fn()}
        formatCostumeLabel={(value) => value}
        formatFormLabel={(value) => value}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toggle Shiny' }));
    fireEvent.click(screen.getByRole('button', { name: 'Toggle Costume' }));
    fireEvent.click(screen.getByRole('button', { name: 'Toggle Shadow' }));

    expect(onShinyToggle).toHaveBeenCalledTimes(1);
    expect(onCostumeToggle).toHaveBeenCalledTimes(1);
    expect(onShadowToggle).toHaveBeenCalledTimes(1);
  });

  it('renders form and costume dropdowns when options are available', () => {
    render(
      <VariantSearchTogglePanel
        isShiny={true}
        isShadow={false}
        showCostumeDropdown={true}
        onShinyToggle={vi.fn()}
        onCostumeToggle={vi.fn()}
        onShadowToggle={vi.fn()}
        availableForms={['None', 'Mega']}
        selectedForm="Mega"
        onFormChange={vi.fn()}
        availableCostumeNames={['Party']}
        costume="Party"
        onCostumeChange={vi.fn()}
        formatCostumeLabel={(value) => value}
        formatFormLabel={(value) => value}
      />,
    );

    expect(screen.getByTestId('dropdown-Form')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-Costume')).toBeInTheDocument();
  });
});

