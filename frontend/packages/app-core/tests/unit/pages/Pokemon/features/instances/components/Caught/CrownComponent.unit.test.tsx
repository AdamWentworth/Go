import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import CrownComponent from '@/pages/Pokemon/features/instances/components/Caught/CrownComponent';

const makeCrownForms = () => [
  {
    id: 1,
    base_pokemon_id: 2290,
    crown_pokemon_id: 888,
    display_form: 'Crowned Sword',
    name: 'Zacian',
    type_1_id: 17,
    type1_name: 'Steel',
    image_url: '/images/default/pokemon_888.png',
    image_url_shiny: '/images/shiny/shiny_pokemon_888.png',
  },
  {
    id: 2,
    base_pokemon_id: 2291,
    crown_pokemon_id: 889,
    display_form: 'Crowned Shield',
    name: 'Zamazenta',
    type_1_id: 17,
    type1_name: 'Steel',
    image_url: '/images/default/pokemon_889.png',
    image_url_shiny: '/images/shiny/shiny_pokemon_889.png',
  },
];

describe('CrownComponent', () => {
  it('renders crown actions with energy icons in edit mode', () => {
    render(
      <CrownComponent
        crownData={{ isCrown: false, crownForm: null }}
        setCrownData={vi.fn()}
        editMode={true}
        crownForms={makeCrownForms()}
        isShadow={false}
      />,
    );

    expect(screen.getByText('Change to Crowned Sword form')).toBeInTheDocument();
    expect(screen.getByText('Change to Crowned Shield form')).toBeInTheDocument();
    expect(screen.getByAltText('Crowned Sword energy')).toBeInTheDocument();
    expect(screen.getByAltText('Crowned Shield energy')).toBeInTheDocument();
    expect(screen.getByText('Change to Hero form')).toBeInTheDocument();
  });

  it('sets selected crown form when a crown action is clicked', () => {
    const setCrownData = vi.fn();

    render(
      <CrownComponent
        crownData={{ isCrown: false, crownForm: null }}
        setCrownData={setCrownData}
        editMode={true}
        crownForms={makeCrownForms()}
        isShadow={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /change to crowned shield form/i }));

    expect(setCrownData).toHaveBeenCalledWith({
      isCrown: true,
      crownForm: 'Crowned Shield',
    });
  });

  it('can switch back to hero form from crowned form', () => {
    const setCrownData = vi.fn();

    render(
      <CrownComponent
        crownData={{ isCrown: true, crownForm: 'Crowned Sword' }}
        setCrownData={setCrownData}
        editMode={true}
        crownForms={makeCrownForms()}
        isShadow={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /change to hero form/i }));

    expect(setCrownData).toHaveBeenCalledWith({
      isCrown: false,
      crownForm: null,
    });
  });

  it('renders static image-only mode when edit mode is off', () => {
    render(
      <CrownComponent
        crownData={{ isCrown: true, crownForm: 'Crowned Sword' }}
        setCrownData={vi.fn()}
        editMode={false}
        crownForms={makeCrownForms()}
        isShadow={false}
      />,
    );

    expect(screen.getByAltText('Crown Toggle')).toBeInTheDocument();
    expect(screen.queryByText('Change to Crowned Sword form')).not.toBeInTheDocument();
  });
});

