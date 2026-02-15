import { describe, expect, it } from 'vitest';

import { URLSelect } from '@/pages/Search/utils/URLSelect';

const basePokemonInfo = {
  image_url: '/images/base.png',
  image_url_shiny: '/images/shiny.png',
  image_url_shadow: '/images/shadow.png',
  image_url_shiny_shadow: '/images/shiny_shadow.png',
  shadow_shiny_available: 1,
  female_unique: 1,
  female_data: {
    image_url: '/images/female_base.png',
    shiny_image_url: '/images/female_shiny.png',
    shadow_image_url: '/images/female_shadow.png',
    shiny_shadow_image_url: '/images/female_shiny_shadow.png',
  },
  max: [
    {
      dynamax_image_url: '/images/dmax.png',
      shiny_dynamax_image_url: '/images/dmax_shiny.png',
      gigantamax_image_url: '/images/gmax.png',
      shiny_gigantamax_image_url: '/images/gmax_shiny.png',
    },
  ],
  costumes: [
    {
      costume_id: 7,
      image_url: '/images/costume_base.png',
      image_url_shiny: '/images/costume_shiny.png',
      image_url_shadow: '/images/costume_shadow.png',
      image_url_shiny_shadow: '/images/costume_shiny_shadow.png',
      image_url_female: '/images/costume_female.png',
      image_url_shiny_female: '/images/costume_female_shiny.png',
      image_url_shadow_female: '/images/costume_female_shadow.png',
      image_url_shiny_shadow_female: '/images/costume_female_shiny_shadow.png',
      max: [{ gigantamax_image_url: '/images/costume_gmax.png' }],
    },
  ],
};

describe('URLSelect', () => {
  it('returns null when pokemonInfo is missing', () => {
    const result = URLSelect(undefined, {
      shiny: false,
      shadow: false,
      dynamax: false,
      gigantamax: false,
    });
    expect(result).toBeNull();
  });

  it('uses female shiny-shadow image when available for unique female forms', () => {
    const result = URLSelect(basePokemonInfo, {
      shiny: true,
      shadow: true,
      dynamax: false,
      gigantamax: false,
      gender: 'Female',
    });
    expect(result).toBe('/images/female_shiny_shadow.png');
  });

  it('preserves legacy precedence where shiny branch wins before dynamax branch', () => {
    const result = URLSelect(basePokemonInfo, {
      shiny: true,
      shadow: false,
      dynamax: true,
      gigantamax: false,
      gender: 'Male',
    });
    expect(result).toBe('/images/shiny.png');
  });

  it('lets costume gigantamax image override base gigantamax image', () => {
    const result = URLSelect(basePokemonInfo, {
      shiny: false,
      shadow: false,
      dynamax: false,
      gigantamax: true,
      costume_id: 7,
      gender: 'Male',
    });
    expect(result).toBe('/images/costume_gmax.png');
  });
});
