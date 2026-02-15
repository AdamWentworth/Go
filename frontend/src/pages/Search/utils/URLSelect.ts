type MaxData = {
  shiny_gigantamax_image_url?: string | null;
  gigantamax_image_url?: string | null;
  shiny_dynamax_image_url?: string | null;
  dynamax_image_url?: string | null;
};

type FemaleData = {
  shiny_shadow_image_url?: string | null;
  shadow_image_url?: string | null;
  shiny_image_url?: string | null;
  image_url?: string | null;
};

type CostumeData = {
  costume_id?: number | string | null;
  image_url?: string | null;
  image_url_shiny?: string | null;
  image_url_shadow?: string | null;
  image_url_shiny_shadow?: string | null;
  image_url_female?: string | null;
  image_url_shiny_female?: string | null;
  image_url_shadow_female?: string | null;
  image_url_shiny_shadow_female?: string | null;
  max?: MaxData[];
};

type PokemonInfo = {
  image_url?: string | null;
  image_url_shiny?: string | null;
  image_url_shadow?: string | null;
  image_url_shiny_shadow?: string | null;
  shadow_shiny_available?: boolean | number;
  female_data?: FemaleData;
  female_unique?: number;
  max?: MaxData[];
  costumes?: CostumeData[];
};

type ItemDetails = {
  dynamax?: boolean;
  gigantamax?: boolean;
  shiny?: boolean;
  shadow?: boolean;
  costume_id?: number | string | null;
  gender?: string | null;
};

export const URLSelect = (
  pokemonInfo: PokemonInfo | null | undefined,
  item: ItemDetails,
): string | null | undefined => {
  if (!pokemonInfo) return null;

  let url = pokemonInfo.image_url;

  const isDynamax = !!item.dynamax;
  const isGigantamax = !!item.gigantamax;
  const isShiny = !!item.shiny;
  const isShadow = !!item.shadow;
  const selectedCostumeId = item.costume_id;
  const selectedGender = item.gender;

  const isFemale = selectedGender === 'Female';
  const hasFemaleData = pokemonInfo.female_data !== undefined;
  const hasUniqueFemaleForm = pokemonInfo.female_unique === 1;

  if (isGigantamax) {
    if (pokemonInfo.max && pokemonInfo.max.length > 0) {
      const gigantamaxData = pokemonInfo.max[0];
      if (isShiny) {
        url = gigantamaxData.shiny_gigantamax_image_url || url;
      } else {
        url = gigantamaxData.gigantamax_image_url || url;
      }
    }
  } else {
    if (isShiny && isShadow) {
      if (pokemonInfo.shadow_shiny_available) {
        url =
          isFemale && hasFemaleData && hasUniqueFemaleForm
            ? pokemonInfo.female_data?.shiny_shadow_image_url
            : pokemonInfo.image_url_shiny_shadow;
      } else {
        url =
          isFemale && hasFemaleData && hasUniqueFemaleForm
            ? pokemonInfo.female_data?.shadow_image_url
            : pokemonInfo.image_url_shadow;
      }
    } else if (isShiny) {
      url =
        isFemale && hasFemaleData && hasUniqueFemaleForm
          ? pokemonInfo.female_data?.shiny_image_url
          : pokemonInfo.image_url_shiny;
    } else if (isShadow) {
      url =
        isFemale && hasFemaleData && hasUniqueFemaleForm
          ? pokemonInfo.female_data?.shadow_image_url
          : pokemonInfo.image_url_shadow;
    } else if (isDynamax) {
      if (pokemonInfo.max && pokemonInfo.max.length > 0) {
        const dynamaxData = pokemonInfo.max[0];
        url = isShiny
          ? dynamaxData.shiny_dynamax_image_url ||
            dynamaxData.dynamax_image_url ||
            url
          : dynamaxData.dynamax_image_url || url;
      }
    } else {
      url =
        isFemale && hasFemaleData && hasUniqueFemaleForm
          ? pokemonInfo.female_data?.image_url
          : pokemonInfo.image_url;
    }
  }

  if (selectedCostumeId && pokemonInfo.costumes && pokemonInfo.costumes.length > 0) {
    const selectedCostumeData = pokemonInfo.costumes.find(
      (costume) => costume.costume_id === selectedCostumeId,
    );
    if (selectedCostumeData) {
      if (isFemale && selectedCostumeData.image_url_female) {
        url =
          isShiny && isShadow
            ? selectedCostumeData.image_url_shiny_shadow_female ||
              selectedCostumeData.image_url_shiny_female ||
              selectedCostumeData.image_url_female
            : isShiny
              ? selectedCostumeData.image_url_shiny_female ||
                selectedCostumeData.image_url_female
              : isShadow
                ? selectedCostumeData.image_url_shadow_female ||
                  selectedCostumeData.image_url_female
                : selectedCostumeData.image_url_female;
      } else {
        url =
          isShiny && isShadow
            ? selectedCostumeData.image_url_shiny_shadow ||
              selectedCostumeData.image_url_shiny ||
              selectedCostumeData.image_url
            : isShadow
              ? selectedCostumeData.image_url_shadow || selectedCostumeData.image_url
              : isShiny
                ? selectedCostumeData.image_url_shiny || selectedCostumeData.image_url
                : selectedCostumeData.image_url;
      }

      if (isGigantamax && selectedCostumeData.max && selectedCostumeData.max.length > 0) {
        const costumeGigantamaxData = selectedCostumeData.max[0];
        if (isShiny) {
          url = costumeGigantamaxData.shiny_gigantamax_image_url || url;
        } else {
          url = costumeGigantamaxData.gigantamax_image_url || url;
        }
      }
    }
  }

  return url;
};
