type ShadowCostumeData = {
  image_url_shadow_costume?: string | null;
  [key: string]: unknown;
};

type CostumeData = {
  name: string;
  image_url_shiny?: string | null;
  shadow_costume?: ShadowCostumeData | null;
  [key: string]: unknown;
};

type SearchVariant = {
  name: string;
  form?: string | null;
  shiny_available?: boolean | number;
  date_shadow_available?: string | null;
  shadow_shiny_available?: boolean | number;
  costumes?: CostumeData[];
  [key: string]: unknown;
};

type ValidationResult = {
  error: string | null;
  availableCostumes: CostumeData[];
  availableForms: Array<string | null | undefined>;
};

const validatePokemon = (
  pokemonData: SearchVariant[],
  name: string,
  shinyChecked: boolean,
  shadowChecked: boolean,
  selectedCostume: string | null | undefined,
  form: string | null | undefined,
  dynamax: boolean,
  gigantamax: boolean,
): ValidationResult => {
  if (dynamax || gigantamax) {
    if (shadowChecked) {
      return {
        error: 'Shadow not available for Dynamax/Gigantamax.',
        availableCostumes: [],
        availableForms: [],
      };
    }

    if (selectedCostume && selectedCostume !== 'None') {
      return {
        error: 'Costumes not available for Dynamax/Gigantamax.',
        availableCostumes: [],
        availableForms: [],
      };
    }
  }

  const matchedPokemon = pokemonData.find(
    (variant) =>
      variant.name.toLowerCase() === name.toLowerCase() &&
      (form ? variant.form === form : true),
  );

  if (!matchedPokemon) {
    return {
      error: `No match found for Pokémon "${name}" with form "${form}".`,
      availableCostumes: [],
      availableForms: [],
    };
  }

  if (shinyChecked && !matchedPokemon.shiny_available) {
    return {
      error: `Shiny variant not available for "${name}".`,
      availableCostumes: [],
      availableForms: [],
    };
  }

  if (shadowChecked && !matchedPokemon.date_shadow_available) {
    return {
      error: `Shadow variant not available for "${name}".`,
      availableCostumes: [],
      availableForms: [],
    };
  }

  if (shinyChecked && shadowChecked && !matchedPokemon.shadow_shiny_available) {
    return {
      error: `Shiny shadow variant not available for "${name}".`,
      availableCostumes: [],
      availableForms: [],
    };
  }

  const availableForms = pokemonData
    .filter((variant) => variant.name.toLowerCase() === name.toLowerCase())
    .map((variant) => variant.form);

  const availableCostumes = matchedPokemon.costumes || [];

  if (!selectedCostume || selectedCostume === 'None') {
    return { error: null, availableCostumes, availableForms };
  }

  const selectedCostumeData = matchedPokemon.costumes?.find(
    (costume) => costume.name === selectedCostume,
  );

  if (!selectedCostumeData) {
    return {
      error: `Costume "${selectedCostume}" not found.`,
      availableCostumes: matchedPokemon.costumes || [],
      availableForms: [],
    };
  }

  if (shinyChecked && shadowChecked) {
    if (selectedCostumeData.shadow_costume) {
      if (!selectedCostumeData.shadow_costume.image_url_shadow_costume) {
        return {
          error: `No image available for shiny shadow costume "${selectedCostume}".`,
          availableCostumes: matchedPokemon.costumes || [],
          availableForms: [],
        };
      }
    } else {
      return {
        error: `Shadow costume variant not available for "${selectedCostume}".`,
        availableCostumes: matchedPokemon.costumes || [],
        availableForms: [],
      };
    }
  }

  if (shinyChecked && !selectedCostumeData.image_url_shiny) {
    return {
      error: `No shiny variant available for the costume "${selectedCostume}".`,
      availableCostumes: matchedPokemon.costumes || [],
      availableForms: [],
    };
  }

  if (shadowChecked && !selectedCostumeData.shadow_costume) {
    return {
      error: `No shadow variant available for the costume "${selectedCostume}".`,
      availableCostumes: matchedPokemon.costumes || [],
      availableForms: [],
    };
  }

  return { error: null, availableCostumes, availableForms };
};

export default validatePokemon;
