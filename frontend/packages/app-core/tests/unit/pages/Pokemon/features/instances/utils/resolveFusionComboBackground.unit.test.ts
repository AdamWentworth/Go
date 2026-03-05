import { describe, expect, it } from 'vitest';

import { resolveFusionComboBackground } from '@/pages/Pokemon/features/instances/utils/resolveFusionComboBackground';
import type { VariantBackground } from '@/types/pokemonSubTypes';

const buildBackground = (overrides: Partial<VariantBackground>): VariantBackground => ({
  background_id: 1,
  image_url: 'https://example.com/bg-1.png',
  name: 'Background',
  costume_id: 0,
  date: '2025-01-01',
  location: 'Anywhere',
  ...overrides,
});

describe('resolveFusionComboBackground', () => {
  it('returns combo background when member1/member2 backgrounds match rule', () => {
    const result = resolveFusionComboBackground({
      pokemonId: 800,
      fusionEntries: [
        {
          fusion_id: 1,
          name: 'Dusk Mane Necrozma',
          base_pokemon_id1: 800,
          base_pokemon_id2: 791,
          background_combo_rules: [
            {
              member1_background_id: 201,
              member2_background_id: 301,
              combo_background_id: 401,
            },
          ],
        },
      ],
      resolvedFusionId: 1,
      fusionForm: 'Dusk Mane Necrozma',
      ownBackgroundId: 201,
      partnerBackgroundId: 301,
      availableBackgrounds: [
        buildBackground({ background_id: 201, name: 'Necrozma BG' }),
        buildBackground({ background_id: 301, name: 'Solgaleo BG' }),
        buildBackground({ background_id: 401, name: 'Dusk Mane Combo' }),
      ],
    });

    expect(result?.background_id).toBe(401);
    expect(result?.name).toBe('Dusk Mane Combo');
  });

  it('supports reversed orientation when open pokemon is member2', () => {
    const result = resolveFusionComboBackground({
      pokemonId: 791,
      fusionEntries: [
        {
          fusion_id: 1,
          name: 'Dusk Mane Necrozma',
          base_pokemon_id1: 800,
          base_pokemon_id2: 791,
          background_combo_rules: [
            {
              member1_background_id: 201,
              member2_background_id: 301,
              combo_background_id: 401,
            },
          ],
        },
      ],
      resolvedFusionId: 1,
      fusionForm: 'Dusk Mane Necrozma',
      ownBackgroundId: 301,
      partnerBackgroundId: 201,
      availableBackgrounds: [buildBackground({ background_id: 401, name: 'Dusk Mane Combo' })],
    });

    expect(result?.background_id).toBe(401);
  });

  it('returns null when no combo rule matches selected pair', () => {
    const result = resolveFusionComboBackground({
      pokemonId: 800,
      fusionEntries: [
        {
          fusion_id: 2,
          name: 'Dawn Wings Necrozma',
          base_pokemon_id1: 800,
          base_pokemon_id2: 792,
          background_combo_rules: [
            {
              member1_background_id: 210,
              member2_background_id: 320,
              combo_background_id: 420,
            },
          ],
        },
      ],
      resolvedFusionId: 2,
      fusionForm: 'Dawn Wings Necrozma',
      ownBackgroundId: 201,
      partnerBackgroundId: 301,
      availableBackgrounds: [buildBackground({ background_id: 420, name: 'Dawn Wings Combo' })],
    });

    expect(result).toBeNull();
  });

  it('prefers explicit fusion form name over mismatched resolved fusion id', () => {
    const result = resolveFusionComboBackground({
      pokemonId: 800,
      fusionEntries: [
        {
          fusion_id: 1,
          name: 'Dusk Mane Necrozma',
          base_pokemon_id1: 800,
          base_pokemon_id2: 791,
          background_combo_rules: [
            {
              member1_background_id: 201,
              member2_background_id: 301,
              combo_background_id: 401,
            },
          ],
        },
        {
          fusion_id: 2,
          name: 'Dawn Wings Necrozma',
          base_pokemon_id1: 800,
          base_pokemon_id2: 792,
          background_combo_rules: [
            {
              member1_background_id: 202,
              member2_background_id: 302,
              combo_background_id: 402,
            },
          ],
        },
      ],
      resolvedFusionId: 1,
      fusionForm: 'Dawn Wings Necrozma',
      ownBackgroundId: 202,
      partnerBackgroundId: 302,
      availableBackgrounds: [buildBackground({ background_id: 402, name: 'Dawn Wings Combo' })],
    });

    expect(result?.background_id).toBe(402);
  });

  it('builds combo background from rule metadata when combo id is not in available backgrounds', () => {
    const result = resolveFusionComboBackground({
      pokemonId: 800,
      fusionEntries: [
        {
          fusion_id: 2,
          name: 'Dawn Wings Necrozma',
          base_pokemon_id1: 800,
          base_pokemon_id2: 792,
          background_combo_rules: [
            {
              member1_background_id: 18,
              member2_background_id: 17,
              combo_background_id: 19,
              combo_background_name: 'GoFest2024 Wormhole Moon',
              combo_background_location: 'Global',
              combo_background_image_url: '/images/backgrounds/wormhole_moon.png',
              combo_background_date: '2024-07-14',
            },
          ],
        },
      ],
      resolvedFusionId: 2,
      fusionForm: 'Dawn Wings Necrozma',
      ownBackgroundId: 18,
      partnerBackgroundId: 17,
      availableBackgrounds: [buildBackground({ background_id: 18 }), buildBackground({ background_id: 17 })],
    });

    expect(result).toEqual(
      expect.objectContaining({
        background_id: 19,
        name: 'GoFest2024 Wormhole Moon',
        image_url: '/images/backgrounds/wormhole_moon.png',
      }),
    );
  });
});
