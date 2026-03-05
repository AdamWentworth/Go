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
  it('shows a disabled mega evolve action in read mode when mega is available', () => {
    render(
      <MegaComponent
        megaData={baseMegaData}
        setMegaData={vi.fn()}
        editMode={false}
        megaEvolutions={[makeMegaEvolution()]}
        isShadow={false}
        name="Tyranitar"
        basePokemonId={248}
        isShiny={false}
      />,
    );

    const button = screen.getByRole('button', { name: /mega evolve/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(screen.getByAltText('Mega Icon')).toBeInTheDocument();
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
        basePokemonId={248}
        isShiny={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /mega evolve/i }));
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
        basePokemonId={248}
        isShiny={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /mega evolve/i }));
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
        basePokemonId={248}
        isShiny={false}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows a change form action to return to base when mega is active', () => {
    render(
      <MegaComponent
        megaData={{ isMega: true, mega: true, megaForm: null }}
        setMegaData={vi.fn()}
        editMode={true}
        megaEvolutions={[makeMegaEvolution()]}
        isShadow={false}
        name="Tyranitar"
        basePokemonId={248}
        isShiny={false}
      />,
    );

    expect(screen.getByRole('button', { name: /change form/i })).toBeInTheDocument();
    expect(screen.getByAltText('Base Form')).toBeInTheDocument();
  });
});
