import { describe, expect, it } from 'vitest';

import {
  countCaughtFusionOptions,
  resolveCaughtPowerVisibility,
  resolveCaughtSectionVisibility,
} from '@/pages/Pokemon/features/instances/utils/caughtInstanceVisibility';

describe('caughtInstanceVisibility utils', () => {
  it('counts fusion options for the current base pokemon only', () => {
    expect(
      countCaughtFusionOptions(
        [
          { base_pokemon_id1: 25, fusion_id: 1 },
          { base_pokemon_id1: 25, fusion_id: null },
          { base_pokemon_id1: 26, fusion_id: 2 },
        ],
        25,
      ),
    ).toBe(1);
    expect(countCaughtFusionOptions(null, 25)).toBe(0);
  });

  it('enables visible power sections when eligible mechanics are available', () => {
    expect(
      resolveCaughtPowerVisibility({
        megaEvolutionCount: 1,
        crownFormCount: 1,
        pokemonName: 'Pikachu',
        variantType: 'dynamax',
        maxCount: 3,
        editMode: true,
        isShadow: false,
        isPurified: false,
        fusionOptionCount: 1,
        isFused: false,
      }),
    ).toMatchObject({
      canRenderMegaPower: true,
      canRenderCrownPower: true,
      canRenderMaxPower: true,
      canRenderFusionPower: true,
      hasMaxVariant: true,
      showPowerSectionDivider: true,
    });
  });

  it('applies shadow, clone, costume, and purified restrictions', () => {
    expect(
      resolveCaughtPowerVisibility({
        megaEvolutionCount: 1,
        crownFormCount: 1,
        pokemonName: 'Clone Charizard',
        variantType: 'dynamax_costume',
        maxCount: 1,
        editMode: true,
        isShadow: true,
        isPurified: false,
        fusionOptionCount: 0,
        isFused: false,
      }),
    ).toMatchObject({
      canRenderMegaPower: false,
      canRenderCrownPower: false,
      canRenderMaxPower: false,
      canRenderFusionPower: false,
      showPowerSectionDivider: false,
    });

    expect(
      resolveCaughtPowerVisibility({
        megaEvolutionCount: 0,
        crownFormCount: 0,
        pokemonName: 'Pikachu',
        variantType: 'gigantamax',
        maxCount: 1,
        editMode: true,
        isShadow: false,
        isPurified: true,
        fusionOptionCount: 0,
        isFused: false,
      }).canRenderMaxPower,
    ).toBe(false);
  });

  it('shows fusion power for already fused pokemon without available options', () => {
    expect(
      resolveCaughtPowerVisibility({
        megaEvolutionCount: 0,
        crownFormCount: 0,
        pokemonName: 'Necrozma',
        variantType: 'default',
        maxCount: 0,
        editMode: false,
        isShadow: false,
        isPurified: false,
        fusionOptionCount: 0,
        isFused: true,
      }),
    ).toMatchObject({
      canRenderFusionPower: true,
      showPowerSectionDivider: true,
    });
  });

  it('shows special Max upgrades only for eligible crowned forms and Eternatus', () => {
    const base = {
      megaEvolutionCount: 0,
      crownFormCount: 0,
      pokemonName: 'Pokemon',
      variantType: 'default',
      maxCount: 0,
      editMode: true,
      isShadow: false,
      isPurified: false,
      fusionOptionCount: 0,
      isFused: false,
    };

    expect(
      resolveCaughtPowerVisibility({
        ...base,
        pokemonId: 888,
        isCrowned: true,
      }),
    ).toMatchObject({
      hasSpecialMaxAccess: true,
      canRenderMaxPower: true,
      showPowerSectionDivider: true,
    });
    expect(
      resolveCaughtPowerVisibility({
        ...base,
        pokemonId: 888,
        isCrowned: false,
      }).canRenderMaxPower,
    ).toBe(false);
    expect(
      resolveCaughtPowerVisibility({
        ...base,
        pokemonId: 890,
      }).canRenderMaxPower,
    ).toBe(true);
  });

  it('resolves stats, meta divider, and bottom gap visibility', () => {
    expect(
      resolveCaughtSectionVisibility({
        showPowerSectionDivider: true,
        movesAndIVVisible: false,
        metaPanelVisible: true,
      }),
    ).toEqual({
      showStatsDivider: true,
      showMetaDivider: false,
      addStatsBottomGap: false,
    });

    expect(
      resolveCaughtSectionVisibility({
        showPowerSectionDivider: false,
        movesAndIVVisible: true,
        metaPanelVisible: true,
      }),
    ).toEqual({
      showStatsDivider: true,
      showMetaDivider: true,
      addStatsBottomGap: false,
    });

    expect(
      resolveCaughtSectionVisibility({
        showPowerSectionDivider: false,
        movesAndIVVisible: false,
        metaPanelVisible: false,
      }),
    ).toEqual({
      showStatsDivider: false,
      showMetaDivider: false,
      addStatsBottomGap: true,
    });
  });
});
