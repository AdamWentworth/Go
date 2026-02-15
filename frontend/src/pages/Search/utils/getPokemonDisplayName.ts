import { formatCostumeName, formatForm } from '../../../utils/formattingHelpers';

type PokemonCostume = {
  costume_id?: number | string | null;
  name?: string | null;
};

type PokemonInfo = {
  name: string;
  form?: string | null;
  costumes?: PokemonCostume[] | null;
};

type SearchDisplayItem = {
  shiny?: boolean;
  shadow?: boolean;
  costume_id?: number | string | null;
  pokemonInfo: PokemonInfo;
};

const capitalizeFirstLetter = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const getPokemonDisplayName = (item: SearchDisplayItem): string => {
  let displayName = '';

  if (item.shiny && item.shadow) {
    displayName += 'Shiny Shadow ';
  } else if (item.shiny) {
    displayName += 'Shiny ';
  } else if (item.shadow) {
    displayName += 'Shadow ';
  }

  if (item.pokemonInfo.form) {
    displayName += `${formatForm(item.pokemonInfo.form)} `;
  }

  if (item.costume_id) {
    const costumeName = item.pokemonInfo.costumes
      ?.find((costume) => costume.costume_id === item.costume_id)
      ?.name;
    if (costumeName) {
      displayName += `${formatCostumeName(costumeName)} `;
    }
  }

  displayName += capitalizeFirstLetter(item.pokemonInfo.name);

  return displayName.trim();
};

export default getPokemonDisplayName;
