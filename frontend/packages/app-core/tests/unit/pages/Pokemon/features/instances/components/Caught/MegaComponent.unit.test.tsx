import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import MegaComponent from '@/pages/Pokemon/features/instances/components/Caught/MegaComponent';
import type { MegaData } from '@/pages/Pokemon/features/instances/utils/buildInstanceChanges';

const baseMegaData: MegaData = {
  isMega: false,
  mega: false,
  megaForm: null,
};

const makeMegaEvolution = () => ({
  id: 248,
  date_available: '2024-01-01',
  mega_energy_cost: 200,
  type1_name: 'Rock',
  type_1_id: 6,
  form: null as string | null,
});

describe('MegaComponent', () => {
  it('shows a desaturated mega icon in read mode when mega is available', () => {
    render(
      <MegaComponent
        megaData={baseMegaData}
        setMegaData={vi.fn()}
        editMode={false}
        megaEvolutions={[makeMegaEvolution()]}
        isShadow={false}
        name="Tyranitar"
      />,
    );

    const image = screen.getByAltText('Mega Toggle');
    expect(image).toBeInTheDocument();
    expect(image).toHaveClass('desaturated');
    expect(image).toHaveClass('static-mode');
  });

  it('does not toggle mega state when edit mode is off', () => {
    const setMegaData = vi.fn();

    render(
      <MegaComponent
        megaData={baseMegaData}
        setMegaData={setMegaData}
        editMode={false}
        megaEvolutions={[makeMegaEvolution()]}
        isShadow={false}
        name="Tyranitar"
      />,
    );

    fireEvent.click(screen.getByAltText('Mega Toggle'));
    expect(setMegaData).not.toHaveBeenCalled();
  });

  it('toggles mega state in edit mode', () => {
    const setMegaData = vi.fn();

    render(
      <MegaComponent
        megaData={baseMegaData}
        setMegaData={setMegaData}
        editMode={true}
        megaEvolutions={[makeMegaEvolution()]}
        isShadow={false}
        name="Tyranitar"
      />,
    );

    fireEvent.click(screen.getByAltText('Mega Toggle'));
    expect(setMegaData).toHaveBeenCalledWith({
      isMega: true,
      mega: true,
      megaForm: null,
    });
  });

  it('does not render when mega evolutions are unavailable', () => {
    const { container } = render(
      <MegaComponent
        megaData={baseMegaData}
        setMegaData={vi.fn()}
        editMode={true}
        megaEvolutions={[]}
        isShadow={false}
        name="Tyranitar"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
