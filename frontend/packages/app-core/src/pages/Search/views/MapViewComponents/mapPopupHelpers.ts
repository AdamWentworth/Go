import { URLSelect } from '../../utils/URLSelect';
import getPokemonDisplayName from '../../utils/getPokemonDisplayName';

export type MapPopupMove = {
  move_id: number;
  name: string;
  type: string;
  type_name: string;
  legacy?: boolean;
};

type MapPopupCostume = {
  costume_id?: number | string | null;
  name?: string | null;
  [key: string]: unknown;
};

type MapPopupPokemonInfo = {
  name?: string | null;
  form?: string | null;
  costumes?: MapPopupCostume[] | null;
  moves?: MapPopupMove[] | null;
  [key: string]: unknown;
} | null;

type MapPopupDisplayItem = {
  shiny?: boolean;
  shadow?: boolean;
  costume_id?: number | string | null;
  dynamax?: boolean;
  gigantamax?: boolean;
  gender?: string | null;
  pokemonInfo?: MapPopupPokemonInfo;
};

export const getMapPopupPokemonDisplayName = (
  item: MapPopupDisplayItem,
): string => {
  const pokemonInfo = item.pokemonInfo;

  return getPokemonDisplayName({
    shiny: item.shiny,
    shadow: item.shadow,
    costume_id: item.costume_id ?? null,
    pokemonInfo: {
      name:
        typeof pokemonInfo?.name === 'string' && pokemonInfo.name.trim().length > 0
          ? pokemonInfo.name
          : 'Unknown',
      form: typeof pokemonInfo?.form === 'string' ? pokemonInfo.form : null,
      costumes: Array.isArray(pokemonInfo?.costumes) ? pokemonInfo.costumes : null,
    },
  });
};

export const getMapPopupImageUrl = (
  item: MapPopupDisplayItem,
): string | null | undefined => {
  return URLSelect(
    item.pokemonInfo as Parameters<typeof URLSelect>[0],
    {
      dynamax: item.dynamax,
      gigantamax: item.gigantamax,
      shiny: item.shiny,
      shadow: item.shadow,
      costume_id: item.costume_id,
      gender: item.gender,
    },
  );
};
