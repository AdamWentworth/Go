import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import PowerPanel from '@/pages/Pokemon/features/instances/sections/PowerPanel';

const CrownedMaxMoveHarness = () => {
  const [showMaxOptions, setShowMaxOptions] = useState(false);
  const [maxAttack, setMaxAttack] = useState('');
  const [maxGuard, setMaxGuard] = useState('');
  const [maxSpirit, setMaxSpirit] = useState('');

  return (
    <PowerPanel
      pokemon={{
        pokemon_id: 888,
        variant_id: '0888-default',
        variantType: 'default',
        form: 'Hero of Many Battles',
        max: [],
      }}
      editMode={true}
      megaEvolutions={[]}
      crownData={{ isCrown: true, crownForm: 'Crowned Sword' }}
      setCrownData={vi.fn()}
      crownForms={[]}
      isShadow={false}
      name="Zacian"
      dynamax={false}
      gigantamax={false}
      showMaxOptions={showMaxOptions}
      onToggleMax={() => setShowMaxOptions((current) => !current)}
      maxAttack={maxAttack}
      maxGuard={maxGuard}
      maxSpirit={maxSpirit}
      onMaxAttackChange={setMaxAttack}
      onMaxGuardChange={setMaxGuard}
      onMaxSpiritChange={setMaxSpirit}
    />
  );
};

describe('PowerPanel special Max Move controls', () => {
  it('opens and edits all three Crowned Zacian Max Move levels', () => {
    render(<CrownedMaxMoveHarness />);

    expect(screen.queryByLabelText('Max Move levels')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Open Max Move upgrades' }),
    );

    expect(screen.getByLabelText('Max Move levels')).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Max Attack' })).toHaveValue('1');
    expect(screen.getByRole('combobox', { name: 'Max Guard' })).toHaveValue('0');
    expect(screen.getByRole('combobox', { name: 'Max Spirit' })).toHaveValue('0');

    fireEvent.change(screen.getByRole('combobox', { name: 'Max Attack' }), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Max Guard' }), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Max Spirit' }), {
      target: { value: '1' },
    });

    expect(screen.getByRole('combobox', { name: 'Max Attack' })).toHaveValue('3');
    expect(screen.getByRole('combobox', { name: 'Max Guard' })).toHaveValue('2');
    expect(screen.getByRole('combobox', { name: 'Max Spirit' })).toHaveValue('1');

    fireEvent.click(
      screen.getByRole('button', { name: 'Close Max Move upgrades' }),
    );
    expect(screen.queryByLabelText('Max Move levels')).not.toBeInTheDocument();
  });
});
