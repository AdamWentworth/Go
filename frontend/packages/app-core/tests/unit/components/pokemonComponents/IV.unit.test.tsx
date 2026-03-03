import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import IV from '@/components/pokemonComponents/IV';

describe('IV', () => {
  it('adds value-state classes so labels can stay in orange/red palette', () => {
    const { container } = render(
      <IV
        editMode={false}
        ivs={{ Attack: 15, Defense: 10, Stamina: 7 }}
      />,
    );

    expect(container.querySelectorAll('.iv-display-stat.iv-stat-full')).toHaveLength(1);
    expect(container.querySelectorAll('.iv-display-stat.iv-stat-base')).toHaveLength(2);
  });
});
