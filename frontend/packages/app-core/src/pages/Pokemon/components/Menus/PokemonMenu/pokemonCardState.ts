import { resolveFusionComboBackground } from '@/pages/Pokemon/features/instances/utils/resolveFusionComboBackground';
import type { ResolveFusionBackgroundPoolResult } from '@/pages/Pokemon/features/instances/utils/resolveFusionBackgroundPool';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { CrownForm, Fusion, MegaEvolution, VariantBackground } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';
import { getCrownFormLabel } from '@/utils/crownHelpers';
import { parseBackgroundId } from '@/features/instances/utils/instanceIdentity';

export {
  collectInstanceRefCandidates,
  extractLegacyInstanceId,
  findInstanceByRefs,
  normalizeInstanceToken,
  parseBackgroundId,
} from '@/features/instances/utils/instanceIdentity';

export type PokemonCardPokemon = Omit<PokemonVariant, 'instanceData'> & {
  instanceData?: Partial<PokemonInstance>;
  currentImage: string;
};

export type PokemonCardTypeData = {
  type1_name?: string;
  type2_name?: string;
  type_1_icon?: string;
  type_2_icon?: string;
};

export const normalizeFormToken = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

export const buildTypeIcon = (typeName?: string | null): string | undefined => {
  const normalized = typeof typeName === 'string' ? typeName.trim().toLowerCase() : '';
  return normalized ? `/images/types/${normalized}.png` : undefined;
};

export const normalizeTypeName = (value: string | null | undefined): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const parseFusionId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const resolvePokemonCardActiveMegaEvolution = ({
  isMega,
  megaForm,
  megaEvolutions,
}: {
  isMega: boolean;
  megaForm?: string | null;
  megaEvolutions?: MegaEvolution[] | null;
}): MegaEvolution | undefined => {
  if (!isMega || !Array.isArray(megaEvolutions) || megaEvolutions.length === 0) {
    return undefined;
  }

  const normalizedForm = normalizeFormToken(megaForm);
  if (normalizedForm.length === 0) {
    return (
      megaEvolutions.find((entry) => normalizeFormToken(entry.form) === '') ??
      megaEvolutions[0]
    );
  }

  return (
    megaEvolutions.find((entry) => normalizeFormToken(entry.form) === normalizedForm) ??
    megaEvolutions[0]
  );
};

export const resolvePokemonCardActiveFusionEntry = ({
  isFused,
  fusionForm,
  fusionEntries,
  storedFusion,
}: {
  isFused?: boolean;
  fusionForm?: string | null;
  fusionEntries?: Fusion[] | null;
  storedFusion?: Record<string, unknown> | null;
}): Fusion | undefined => {
  if (!isFused || !Array.isArray(fusionEntries) || fusionEntries.length === 0) {
    return undefined;
  }

  const normalizedFusionForm = normalizeFormToken(fusionForm);
  if (normalizedFusionForm.length > 0) {
    return (
      fusionEntries.find((entry) => normalizeFormToken(entry.name) === normalizedFusionForm) ??
      fusionEntries[0]
    );
  }

  const storedFusionId = parseFusionId(storedFusion?.fusion_id) ?? parseFusionId(storedFusion?.id);
  if (storedFusionId != null) {
    return fusionEntries.find((entry) => entry.fusion_id === storedFusionId) ?? fusionEntries[0];
  }

  return fusionEntries[0];
};

export const resolvePokemonCardTypeData = ({
  pokemon,
  isFused,
  activeFusionEntry,
  isCrown,
  activeCrownForm,
  isMega,
  activeMegaEvolution,
}: {
  pokemon: Pick<
    PokemonCardPokemon,
    'type1_name' | 'type2_name' | 'type_1_icon' | 'type_2_icon'
  >;
  isFused?: boolean;
  activeFusionEntry?: Fusion;
  isCrown?: boolean;
  activeCrownForm?: CrownForm;
  isMega?: boolean;
  activeMegaEvolution?: MegaEvolution;
}): PokemonCardTypeData => {
  const baseType1 = pokemon.type1_name;
  const baseType2 = pokemon.type2_name;
  const baseType1Icon = pokemon.type_1_icon || buildTypeIcon(baseType1);
  const baseType2Icon = pokemon.type_2_icon || buildTypeIcon(baseType2);

  if (isFused && activeFusionEntry) {
    const fusionType1 = activeFusionEntry.type1_name ?? baseType1;
    const fusionType2 = activeFusionEntry.type2_name ?? baseType2;
    return {
      type1_name: fusionType1,
      type2_name: fusionType2,
      type_1_icon: buildTypeIcon(fusionType1) ?? baseType1Icon,
      type_2_icon: fusionType2 ? buildTypeIcon(fusionType2) ?? baseType2Icon : undefined,
    };
  }

  if (isCrown && activeCrownForm) {
    const crownType1 = activeCrownForm.type1_name ?? baseType1;
    const crownType2 = activeCrownForm.type2_name ?? baseType2;
    return {
      type1_name: crownType1,
      type2_name: crownType2,
      type_1_icon: buildTypeIcon(crownType1) ?? baseType1Icon,
      type_2_icon: crownType2 ? buildTypeIcon(crownType2) ?? baseType2Icon : undefined,
    };
  }

  if (isMega && activeMegaEvolution) {
    const megaType1 = normalizeTypeName(activeMegaEvolution.type1_name) ?? baseType1;
    const megaHasType2ById =
      typeof activeMegaEvolution.type_2_id === 'number' && activeMegaEvolution.type_2_id > 0;
    const megaType2 =
      normalizeTypeName(activeMegaEvolution.type2_name) ??
      (megaHasType2ById ? baseType2 : undefined);
    return {
      type1_name: megaType1,
      type2_name: megaType2,
      type_1_icon: buildTypeIcon(megaType1) ?? baseType1Icon,
      type_2_icon: megaType2 ? buildTypeIcon(megaType2) ?? baseType2Icon : undefined,
    };
  }

  return {
    type1_name: baseType1,
    type2_name: baseType2,
    type_1_icon: baseType1Icon,
    type_2_icon: baseType2Icon,
  };
};

export const getPokemonCardDisplayName = ({
  pokemon,
  isFused,
  fusionForm,
  isMega,
  megaForm,
  isCrown,
  activeCrownForm,
}: {
  pokemon: Pick<PokemonCardPokemon, 'name' | 'variantType' | 'instanceData'>;
  isFused?: boolean;
  fusionForm?: string | null;
  isMega?: boolean;
  megaForm?: string | null;
  isCrown?: boolean;
  activeCrownForm?: CrownForm;
}): string => {
  if (pokemon.instanceData?.nickname) return pokemon.instanceData.nickname;

  let name = pokemon.name;
  if (isFused && fusionForm) {
    name = pokemon.instanceData?.shiny ? `Shiny ${fusionForm}` : fusionForm;
  }
  if (isMega) {
    const normalizedName = name
      .replace(/^Shiny\s+Mega\s+/i, '')
      .replace(/^Mega\s+/i, '')
      .replace(/^Shiny\s+/i, '');
    const isShinyState =
      Boolean(pokemon.instanceData?.shiny) ||
      pokemon.variantType.includes('shiny') ||
      /^Shiny\s+/i.test(name);
    const megaSuffix =
      megaForm && !normalizedName.toLowerCase().endsWith(megaForm.toLowerCase())
        ? ` ${megaForm}`
        : '';
    name = `${isShinyState ? 'Shiny Mega' : 'Mega'} ${normalizedName}${megaSuffix}`;
  }
  if (isCrown) {
    const crownLabel = getCrownFormLabel(activeCrownForm);
    if (crownLabel) {
      const normalizedName = name.replace(/^Shiny\s+/i, '');
      const isShinyState =
        Boolean(pokemon.instanceData?.shiny) ||
        pokemon.variantType.includes('shiny') ||
        /^Shiny\s+/i.test(name);
      name = `${isShinyState ? 'Shiny ' : ''}${crownLabel} ${normalizedName}`;
    }
  }
  return name;
};

export const getPokemonCardHighlightKey = (pokemon: PokemonCardPokemon): string =>
  pokemon.instanceData?.instance_id ?? pokemon.variant_id;

export const getPokemonCardOwnershipClass = (tagFilter: string): string => {
  const f = (tagFilter || '').toLowerCase();
  switch (f) {
    case 'caught':
      return 'caught';
    case 'trade':
      return 'trade';
    case 'wanted':
      return 'wanted';
    case 'missing':
      return 'missing';
    default:
      return '';
  }
};

export const shouldDisplayPokemonCardLuckyBackdrop = (
  tagFilter: string,
  instanceData: Partial<PokemonInstance> | undefined,
): boolean =>
  Boolean(
    (tagFilter.toLowerCase() === 'wanted' && instanceData?.pref_lucky) ||
      instanceData?.lucky,
  );

export const getPokemonCardCpValue = ({
  tagFilter,
  sortType,
  pokemon,
}: {
  tagFilter: string;
  sortType: string;
  pokemon: Pick<PokemonCardPokemon, 'cp50' | 'instanceData'>;
}): string | number | null =>
  tagFilter !== ''
    ? (pokemon.instanceData?.cp ?? '')
    : sortType === 'combatPower' && pokemon.cp50 != null
      ? pokemon.cp50
      : '';

export const resolvePokemonCardLocationBackground = ({
  pokemon,
  variantByPokemonId,
  resolvedFusionBackgrounds,
  isFused,
  fusedPartnerInstance,
  fusionForm,
}: {
  pokemon: Pick<
    PokemonCardPokemon,
    'backgrounds' | 'fusion' | 'instanceData' | 'pokemon_id'
  >;
  variantByPokemonId: Map<number, { backgrounds?: VariantBackground[] }>;
  resolvedFusionBackgrounds: ResolveFusionBackgroundPoolResult;
  isFused?: boolean;
  fusedPartnerInstance?: Pick<PokemonInstance, 'location_card'> | null;
  fusionForm?: string | null;
}): VariantBackground | null => {
  const locationCardId = parseBackgroundId(pokemon.instanceData?.location_card);
  if (locationCardId == null) return null;

  const fallbackVariant = variantByPokemonId.get(pokemon.pokemon_id);
  const fallbackBackgrounds = fallbackVariant?.backgrounds ?? [];
  const candidateBackgrounds =
    resolvedFusionBackgrounds.backgrounds.length > 0
      ? resolvedFusionBackgrounds.backgrounds
      : Array.isArray(pokemon.backgrounds) && pokemon.backgrounds.length > 0
        ? pokemon.backgrounds
        : fallbackBackgrounds;

  const directBackground =
    candidateBackgrounds.find((bg) => bg.background_id === locationCardId) ??
    fallbackBackgrounds.find((bg) => bg.background_id === locationCardId) ??
    null;

  if (!isFused) return directBackground;

  const ownBackgroundId = directBackground?.background_id ?? locationCardId;
  const partnerBackgroundId = parseBackgroundId(fusedPartnerInstance?.location_card);

  const comboBackground = resolveFusionComboBackground({
    pokemonId: pokemon.pokemon_id,
    fusionEntries: pokemon.fusion ?? [],
    resolvedFusionId: resolvedFusionBackgrounds.fusionId,
    fusionForm: fusionForm ?? null,
    ownBackgroundId,
    partnerBackgroundId,
    availableBackgrounds: candidateBackgrounds,
  });
  if (comboBackground) return comboBackground;

  if (directBackground) return directBackground;

  for (const entry of pokemon.fusion ?? []) {
    for (const rule of entry.background_combo_rules ?? []) {
      if (rule.combo_background_id !== locationCardId) continue;
      const url =
        typeof rule.combo_background_image_url === 'string'
          ? rule.combo_background_image_url.trim()
          : '';
      if (!url) continue;
      return {
        background_id: rule.combo_background_id,
        image_url: url,
        name: rule.combo_background_name ?? `Background ${rule.combo_background_id}`,
        costume_id: 0,
        date: rule.combo_background_date ?? '',
        location: rule.combo_background_location ?? '',
      };
    }
  }

  return null;
};
