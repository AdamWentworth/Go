import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';

export type NativeCollectionFilter = 'all' | 'caught' | 'trade' | 'wanted';

export type NativeCollectionRow = {
  id: string;
  pokemonId: number;
  pokedexNumber: number;
  name: string;
  imageUri: string | null;
  status: Exclude<NativeCollectionFilter, 'all'>;
  cp: number | null;
  favorite: boolean;
  mostWanted: boolean;
};

const firstString = (...values: (string | null | undefined)[]): string | null =>
  values.find((value): value is string => Boolean(value?.trim())) ?? null;

const selectCostumeImage = (
  instance: PokemonInstance,
  pokemon: BasePokemon,
): string | null => {
  if (instance.costume_id == null) return null;
  const costume = pokemon.costumes?.find(
    (entry) => entry.costume_id === instance.costume_id,
  );
  if (!costume) return null;
  const isFemale = instance.gender?.toLowerCase() === 'female';

  if (instance.shadow && costume.shadow_costume) {
    return instance.shiny
      ? firstString(
        isFemale
          ? costume.shadow_costume.image_url_female_shiny_shadow_costume
          : null,
        costume.shadow_costume.image_url_shiny_shadow_costume,
      )
      : firstString(
        isFemale ? costume.shadow_costume.image_url_female_shadow_costume : null,
        costume.shadow_costume.image_url_shadow_costume,
      );
  }

  return instance.shiny
    ? firstString(
      isFemale ? costume.image_url_shiny_female : null,
      costume.image_url_shiny,
    )
    : firstString(isFemale ? costume.image_url_female : null, costume.image_url);
};

export const resolveNativeInstanceImage = (
  instance: PokemonInstance,
  pokemon: BasePokemon,
): string | null => {
  if (instance.gigantamax) {
    const maxForm = pokemon.max?.find((entry) => Boolean(entry.gigantamax));
    return firstString(
      instance.shiny ? maxForm?.shiny_gigantamax_image_url : null,
      maxForm?.gigantamax_image_url,
      instance.shiny ? pokemon.image_url_shiny : null,
      pokemon.image_url,
    );
  }

  if (instance.is_mega || instance.mega) {
    const mega = pokemon.megaEvolutions?.find(
      (entry) => !instance.mega_form || entry.form?.toLowerCase() === instance.mega_form.toLowerCase(),
    ) ?? pokemon.megaEvolutions?.[0];
    return firstString(
      instance.shiny ? mega?.image_url_shiny : null,
      mega?.image_url,
      pokemon.image_url,
    );
  }

  if (instance.is_fused && instance.fusion_form) {
    const fusion = pokemon.fusion?.find(
      (entry) => entry.name.toLowerCase() === instance.fusion_form?.toLowerCase(),
    );
    return firstString(
      instance.shiny ? fusion?.image_url_shiny : null,
      fusion?.image_url,
      pokemon.image_url,
    );
  }

  if (instance.crown) {
    const crown = pokemon.crownForms?.find(
      (entry) => entry.form?.toLowerCase() === instance.fusion_form?.toLowerCase(),
    ) ?? pokemon.crownForms?.[0];
    return firstString(
      instance.shiny ? crown?.image_url_shiny : null,
      crown?.image_url,
      pokemon.image_url,
    );
  }

  const costumeImage = selectCostumeImage(instance, pokemon);
  if (costumeImage) return costumeImage;

  const isFemale = instance.gender?.toLowerCase() === 'female';
  const female = isFemale ? pokemon.female_data : null;
  if (instance.shadow) {
    return firstString(
      instance.shiny ? female?.shiny_shadow_image_url : null,
      instance.shiny ? pokemon.image_url_shiny_shadow : null,
      female?.shadow_image_url,
      pokemon.image_url_shadow,
      pokemon.image_url,
    );
  }
  return firstString(
    instance.shiny ? female?.shiny_image_url : null,
    instance.shiny ? pokemon.image_url_shiny : null,
    female?.image_url,
    pokemon.image_url,
  );
};

const statusForInstance = (
  instance: PokemonInstance,
): NativeCollectionRow['status'] | null => {
  if (instance.is_wanted) return 'wanted';
  if (instance.is_for_trade) return 'trade';
  if (instance.is_caught) return 'caught';
  return null;
};

const displayName = (instance: PokemonInstance, pokemon: BasePokemon): string => {
  if (instance.nickname?.trim()) return instance.nickname.trim();
  const traits = [
    instance.shiny ? 'Shiny' : null,
    instance.shadow ? 'Shadow' : null,
    instance.gigantamax ? 'Gigantamax' : null,
  ].filter(Boolean);
  return [...traits, pokemon.name].join(' ');
};

const absoluteImageUri = (image: string | null, assetOrigin: string): string | null => {
  if (!image) return null;
  try {
    return new URL(image, assetOrigin).toString();
  } catch {
    return null;
  }
};

export const buildNativeCollectionRows = (
  instances: Record<string, PokemonInstance>,
  catalog: BasePokemon[],
  assetOrigin: string,
): NativeCollectionRow[] => {
  const pokemonById = new Map(catalog.map((pokemon) => [pokemon.pokemon_id, pokemon]));

  return Object.entries(instances)
    .flatMap(([key, instance]) => {
      if (instance.disabled) return [];
      const status = statusForInstance(instance);
      const pokemon = pokemonById.get(instance.pokemon_id);
      if (!status || !pokemon) return [];
      return [{
        id: instance.instance_id ?? key,
        pokemonId: instance.pokemon_id,
        pokedexNumber: pokemon.pokedex_number,
        name: displayName(instance, pokemon),
        imageUri: absoluteImageUri(resolveNativeInstanceImage(instance, pokemon), assetOrigin),
        status,
        cp: instance.cp,
        favorite: instance.favorite,
        mostWanted: instance.most_wanted,
      } satisfies NativeCollectionRow];
    })
    .sort((left, right) =>
      left.pokedexNumber - right.pokedexNumber || left.name.localeCompare(right.name),
    );
};

export const filterNativeCollectionRows = (
  rows: NativeCollectionRow[],
  filter: NativeCollectionFilter,
  query: string,
): NativeCollectionRow[] => {
  const normalizedQuery = query.trim().toLowerCase();
  return rows.filter((row) =>
    (filter === 'all' || row.status === filter) &&
    (!normalizedQuery ||
      row.name.toLowerCase().includes(normalizedQuery) ||
      String(row.pokedexNumber).includes(normalizedQuery)),
  );
};
