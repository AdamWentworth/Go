import React, { useEffect, useMemo, useState } from 'react';

import CloseButton from '@/components/CloseButton';
import { useModal } from '@/contexts/ModalContext';
import {
  buildPokedexRegistrationId,
  createManualPokedexRegistration,
  type PokedexRegistrationEntry,
  type PokedexRegistrationFacets,
} from '@/features/pokedex/registrationProjection';

import type { PokemonVariant } from '@/types/pokemonVariants';

import {
  PokedexDetailPokemonImage,
  type PokedexDetailGender,
} from './PokedexDetailPokemonImage';
import { PokedexBattleTab, PokedexInfoTab } from './PokedexPokemonDetailInfo';
import {
  formatDexNumber,
  getDisplayName,
  getFusionId,
  getSpeciesName,
  getTypeChips,
  getVariantCategory,
  getVariantFamilyKey,
  isShadowVariant,
  isShinyVariant,
  normalizeVariantType,
} from './pokedexPokemonDetailModel';
import './PokedexPokemonDetail.css';

type PokedexGenderValue = PokedexDetailGender;
type PokedexPokemonDetailTab = 'registered' | 'info' | 'battle' | 'more';
type PokedexSlotSection =
  | 'primary'
  | 'costume'
  | 'shadow'
  | 'mega'
  | 'max'
  | 'fusion'
  | 'special';
type PokedexComboBadgePlacement = 'left' | 'right';
type PokedexComboFilterGroup = 'status' | 'variant' | 'gender' | 'size' | 'quality';
type PokedexComboFilterKey =
  | 'registered'
  | 'missing'
  | 'pokemon'
  | 'shiny'
  | 'male'
  | 'female'
  | 'xxs'
  | 'xs'
  | 'xl'
  | 'xxl'
  | 'lucky'
  | 'perfect';
type PokedexDetailThemeKey =
  | 'pokemon'
  | 'shiny'
  | 'shadow'
  | 'costume'
  | 'mega'
  | 'dynamax'
  | 'gigantamax'
  | 'fusion'
  | 'shiny-shadow'
  | 'shiny-costume'
  | 'shadow-costume'
  | 'shiny-mega'
  | 'shiny-dynamax'
  | 'shiny-gigantamax'
  | 'shiny-fusion'
  | 'lucky'
  | 'purified'
  | 'xxs'
  | 'xs'
  | 'xl'
  | 'xxl'
  | 'perfect';

interface PokedexPokemonDetailProps {
  pokemon: PokemonVariant;
  variants: PokemonVariant[];
  registrations: PokedexRegistrationEntry[];
  gender?: PokedexGenderValue;
  onRegister?: (entries: PokedexRegistrationEntry[]) => void | Promise<void>;
  onUnregister?: (registrationIds: string[]) => void | Promise<void>;
  onClose: () => void;
}

interface PokedexRegistrationSlot {
  key: string;
  label: string;
  section: PokedexSlotSection;
  pokemon: PokemonVariant;
  facets?: PokedexRegistrationFacets;
  icon?: string;
  iconPlacement?: 'left' | 'right';
  purifiedImage?: boolean;
  releaseDate?: string | null;
  registered: boolean;
  registration?: PokedexRegistrationEntry;
}

interface PokedexComboBadge {
  key: string;
  label: string;
  icon?: string;
  placement: PokedexComboBadgePlacement;
}

interface PokedexComboFilter {
  key: PokedexComboFilterKey;
  label: string;
  group: PokedexComboFilterGroup;
}

interface PokedexRegistrationCombo {
  key: string;
  label: string;
  pokemon: PokemonVariant;
  facets: PokedexRegistrationFacets;
  purifiedImage?: boolean;
  badges: PokedexComboBadge[];
  registered: boolean;
}

interface PokedexComboSection {
  slot: PokedexRegistrationSlot;
  combos: PokedexRegistrationCombo[];
  registeredCount: number;
}

const EMPTY_REGISTRATION_COMBOS: PokedexRegistrationCombo[] = [];

const COMBO_FILTERS: PokedexComboFilter[] = [
  { key: 'registered', label: 'Registered', group: 'status' },
  { key: 'missing', label: 'Missing', group: 'status' },
  { key: 'pokemon', label: 'Pokemon', group: 'variant' },
  { key: 'shiny', label: 'Shiny', group: 'variant' },
  { key: 'male', label: 'Male', group: 'gender' },
  { key: 'female', label: 'Female', group: 'gender' },
  { key: 'xxs', label: 'XXS', group: 'size' },
  { key: 'xs', label: 'XS', group: 'size' },
  { key: 'xl', label: 'XL', group: 'size' },
  { key: 'xxl', label: 'XXL', group: 'size' },
  { key: 'lucky', label: 'Lucky', group: 'quality' },
  { key: 'perfect', label: '100%', group: 'quality' },
];

const EXCLUSIVE_COMBO_FILTER_GROUPS = new Set<PokedexComboFilterGroup>([
  'status',
  'variant',
  'gender',
  'size',
]);

const ICONS_DARK_ON_LIGHT = new Set([
  '/images/appraisal_04.png',
  '/images/height.png',
  '/images/lucky-icon.png',
  '/images/xxl.png',
  '/images/xxs.png',
]);

function getSlotThemeKey(slot?: PokedexRegistrationSlot): PokedexDetailThemeKey {
  if (!slot) return 'pokemon';

  if (slot.facets?.purified === true || slot.purifiedImage === true) return 'purified';
  if (slot.facets?.lucky === true) return 'lucky';
  if (slot.facets?.appraisal === '4-star') return 'perfect';
  if (slot.facets?.size === 'xxs') return 'xxs';
  if (slot.facets?.size === 'xs') return 'xs';
  if (slot.facets?.size === 'xl') return 'xl';
  if (slot.facets?.size === 'xxl') return 'xxl';

  return getVariantCategory(slot.pokemon).replace(/\s+/g, '-') as PokedexDetailThemeKey;
}

function getSlotRegistrationId(
  pokemon: PokemonVariant,
  facets: PokedexRegistrationFacets = {},
): string {
  return buildPokedexRegistrationId({
    pokemon_id: pokemon.pokemon_id,
    form: pokemon.form,
    facets: { variant: pokemon.variantType, ...facets },
  });
}

function getIconClassName(baseClassName: string, icon: string): string {
  return ICONS_DARK_ON_LIGHT.has(icon)
    ? `${baseClassName} ${baseClassName}--dark-on-light`
    : baseClassName;
}

function getSizedImageClassName(
  baseClassName: string,
  facets?: PokedexRegistrationFacets,
): string {
  return facets?.size
    ? `${baseClassName} pokedex-pokemon-detail__size-image--${facets.size}`
    : baseClassName;
}

function getRegistration(
  registrations: PokedexRegistrationEntry[],
  pokemon: PokemonVariant,
  facets?: PokedexRegistrationFacets,
): PokedexRegistrationEntry | undefined {
  const registrationId = getSlotRegistrationId(pokemon, facets);
  return registrations.find((entry) => entry.registration_id === registrationId);
}

function createManualRegistrationForPokemon(
  pokemon: PokemonVariant,
  facets: PokedexRegistrationFacets = {},
): PokedexRegistrationEntry {
  return createManualPokedexRegistration(pokemon, facets);
}

function createManualRegistrationForSlot(
  slot: PokedexRegistrationSlot,
): PokedexRegistrationEntry {
  return createManualRegistrationForPokemon(slot.pokemon, slot.facets ?? {});
}

function createManualRegistrationForCombo(
  combo: PokedexRegistrationCombo,
): PokedexRegistrationEntry {
  return createManualRegistrationForPokemon(combo.pokemon, combo.facets);
}

function createSlot(input: {
  key: string;
  label: string;
  section: PokedexSlotSection;
  pokemon: PokemonVariant;
  registrations: PokedexRegistrationEntry[];
  facets?: PokedexRegistrationFacets;
  icon?: string;
  iconPlacement?: 'left' | 'right';
  purifiedImage?: boolean;
  releaseDate?: string | null;
}): PokedexRegistrationSlot {
  const registration = getRegistration(input.registrations, input.pokemon, input.facets);

  return {
    key: input.key,
    label: input.label,
    section: input.section,
    pokemon: input.pokemon,
    facets: input.facets,
    icon: input.icon,
    iconPlacement: input.iconPlacement,
    purifiedImage: input.purifiedImage,
    releaseDate: input.releaseDate,
    registration,
    registered: registration?.is_registered === true,
  };
}

function getVariantLabel(pokemon: PokemonVariant): string {
  const category = getVariantCategory(pokemon);
  if (category === 'pokemon') return 'Pokemon';
  if (category === 'shiny') return 'Shiny';
  if (category === 'shadow') return 'Shadow';

  return getDisplayName(pokemon);
}

function getFusionIcon(pokemon: PokemonVariant): string {
  const fusionId = getFusionId(pokemon);
  return `/images/fusion_${fusionId ?? 1}.png`;
}

function getVariantIcon(pokemon: PokemonVariant): string | undefined {
  const category = getVariantCategory(pokemon);

  switch (category) {
    case 'shadow':
    case 'shiny shadow':
      return '/images/shadow_icon.png';
    case 'costume':
    case 'shiny costume':
    case 'shadow costume':
      return '/images/costume_icon.png';
    case 'mega':
    case 'shiny mega':
      return '/images/mega.png';
    case 'dynamax':
    case 'shiny dynamax':
      return '/images/dynamax-icon.png';
    case 'gigantamax':
    case 'shiny gigantamax':
      return '/images/gigantamax-icon.png';
    case 'fusion':
    case 'shiny fusion':
      return getFusionIcon(pokemon);
    default:
      return undefined;
  }
}

function getVariantBadge(pokemon: PokemonVariant): PokedexComboBadge | null {
  const icon = getVariantIcon(pokemon);
  if (!icon) return null;

  return {
    key: `variant:${pokemon.variant_id}`,
    label: getVariantLabel(pokemon),
    icon,
    placement: 'right',
  };
}

function getRelatedComboVariants(
  selectedPokemon: PokemonVariant,
  variants: PokemonVariant[],
  includeRelatedFamilyVariants = true,
): PokemonVariant[] {
  if (!includeRelatedFamilyVariants) return [selectedPokemon];

  const familyKey = getVariantFamilyKey(selectedPokemon);
  const related = variants.filter(
    (variant) =>
      variant.pokemon_id === selectedPokemon.pokemon_id &&
      getVariantFamilyKey(variant) === familyKey,
  );

  if (related.length === 0) return [selectedPokemon];

  return related.sort((left, right) => {
    if (isShinyVariant(left) !== isShinyVariant(right)) {
      return isShinyVariant(left) ? 1 : -1;
    }
    return left.variant_id.localeCompare(right.variant_id);
  });
}

function sortSpeciesVariants(variants: PokemonVariant[]): PokemonVariant[] {
  return [...variants].sort((left, right) => {
    const leftCategory = getVariantCategory(left);
    const rightCategory = getVariantCategory(right);
    if (leftCategory !== rightCategory) return leftCategory.localeCompare(rightCategory);

    const leftName = getDisplayName(left);
    const rightName = getDisplayName(right);
    if (leftName !== rightName) return leftName.localeCompare(rightName);

    return left.variant_id.localeCompare(right.variant_id);
  });
}

function getCostumeId(pokemon: PokemonVariant): number | null {
  const match = normalizeVariantType(pokemon).match(/costume_(\d+)/);
  if (!match) return null;

  const costumeId = Number(match[1]);
  return Number.isFinite(costumeId) ? costumeId : null;
}

function getCostumeData(pokemon: PokemonVariant) {
  const costumeId = getCostumeId(pokemon);
  if (costumeId === null) return null;

  return pokemon.costumes?.find((costume) => Number(costume.costume_id) === costumeId) ?? null;
}

function getVariantReleaseDate(pokemon: PokemonVariant): string | null {
  const category = getVariantCategory(pokemon);
  const costume = getCostumeData(pokemon);

  if (costume) {
    if (category === 'shiny costume') {
      return costume.date_shiny_available ?? costume.date_available ?? null;
    }

    if (category === 'shadow costume') {
      return costume.shadow_costume?.date_available ?? costume.date_available ?? null;
    }

    return costume.date_available ?? null;
  }

  if (category === 'shiny shadow') {
    return pokemon.date_shiny_shadow_available ?? pokemon.date_shadow_available ?? null;
  }

  if (category === 'shadow') {
    return pokemon.date_shadow_available ?? null;
  }

  if (category.includes('shiny')) {
    return pokemon.date_shiny_available ?? pokemon.date_available ?? null;
  }

  return pokemon.date_available ?? null;
}

function getVariantFamilyReleaseDate(pokemon: PokemonVariant): string | null {
  const costume = getCostumeData(pokemon);
  if (costume) return costume.date_available ?? null;

  const category = getVariantCategory(pokemon);
  if (category.includes('shadow')) return pokemon.date_shadow_available ?? pokemon.date_available ?? null;
  return pokemon.date_available ?? null;
}

function getDateSortTime(date: string | null): number {
  if (!date) return Number.MAX_SAFE_INTEGER;
  const time = new Date(date).getTime();
  return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER;
}

function formatReleaseDate(date: string | null | undefined): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function getVariantFamilySortLabel(pokemon: PokemonVariant): string {
  const costumeId = getCostumeId(pokemon);
  if (costumeId !== null) return `costume:${String(costumeId).padStart(5, '0')}`;

  return `${getVariantCategory(pokemon)}:${getVariantFamilyKey(pokemon)}`;
}

function sortVariantsByFamilyThenShiny(variants: PokemonVariant[]): PokemonVariant[] {
  return [...variants].sort((left, right) => {
    const leftFamilyDate = getDateSortTime(getVariantFamilyReleaseDate(left));
    const rightFamilyDate = getDateSortTime(getVariantFamilyReleaseDate(right));
    if (leftFamilyDate !== rightFamilyDate) return leftFamilyDate - rightFamilyDate;

    const leftFamilyLabel = getVariantFamilySortLabel(left);
    const rightFamilyLabel = getVariantFamilySortLabel(right);
    if (leftFamilyLabel !== rightFamilyLabel) return leftFamilyLabel.localeCompare(rightFamilyLabel);

    if (isShinyVariant(left) !== isShinyVariant(right)) {
      return isShinyVariant(left) ? 1 : -1;
    }

    const leftReleaseDate = getDateSortTime(getVariantReleaseDate(left));
    const rightReleaseDate = getDateSortTime(getVariantReleaseDate(right));
    if (leftReleaseDate !== rightReleaseDate) return leftReleaseDate - rightReleaseDate;

    return getDisplayName(left).localeCompare(getDisplayName(right)) || left.variant_id.localeCompare(right.variant_id);
  });
}

function getGenderOptions(pokemon: PokemonVariant): PokedexGenderValue[] {
  const genderRate = String(pokemon.gender_rate ?? '').toUpperCase();
  if (genderRate === 'GENDERLESS' || genderRate === 'NONE') return [];
  if (genderRate === 'M/M') return ['Male'];
  if (genderRate === 'F/F') return ['Female'];
  if (genderRate === 'M/F' || genderRate === 'F/M') return ['Male', 'Female'];

  const maleRate = genderRate.match(/(\d+)M/)?.[1];
  const femaleRate = genderRate.match(/(\d+)F/)?.[1];
  const options: PokedexGenderValue[] = [];
  if (Number(maleRate ?? 0) > 0) options.push('Male');
  if (Number(femaleRate ?? 0) > 0) options.push('Female');
  return options;
}

function getComboRegistrationBadges(input: {
  pokemon: PokemonVariant;
  facets: PokedexRegistrationFacets;
}): PokedexComboBadge[] {
  const variantBadge = getVariantBadge(input.pokemon);
  const badges: PokedexComboBadge[] = variantBadge ? [variantBadge] : [];

  if (input.facets.gender === 'Male') {
    badges.push({
      key: 'gender:male',
      label: 'Male',
      icon: '/images/male-icon.png',
      placement: 'left',
    });
  }

  if (input.facets.gender === 'Female') {
    badges.push({
      key: 'gender:female',
      label: 'Female',
      icon: '/images/female-icon.png',
      placement: 'left',
    });
  }

  if (input.facets.size === 'xxs') {
    badges.push({
      key: 'size:xxs',
      label: 'XXS',
      icon: '/images/xxs.png',
      placement: 'left',
    });
  }

  if (input.facets.size === 'xs') {
    badges.push({
      key: 'size:xs',
      label: 'XS',
      icon: '/images/height.png',
      placement: 'left',
    });
  }

  if (input.facets.size === 'xl') {
    badges.push({
      key: 'size:xl',
      label: 'XL',
      icon: '/images/height.png',
      placement: 'left',
    });
  }

  if (input.facets.size === 'xxl') {
    badges.push({
      key: 'size:xxl',
      label: 'XXL',
      icon: '/images/xxl.png',
      placement: 'left',
    });
  }

  if (input.facets.purified === true) {
    badges.push({
      key: 'purified',
      label: 'Purified',
      icon: '/images/purified.png',
      placement: 'left',
    });
  }

  if (input.facets.lucky === true) {
    badges.push({
      key: 'lucky',
      label: 'Lucky',
      icon: '/images/lucky-icon.png',
      placement: 'left',
    });
  }

  if (input.facets.appraisal === '4-star') {
    badges.push({
      key: 'perfect',
      label: '100%',
      icon: '/images/appraisal_04.png',
      placement: 'left',
    });
  }

  return badges;
}

function getComboLabel(input: {
  pokemon: PokemonVariant;
  facets: PokedexRegistrationFacets;
}): string {
  const labels = [
    isShinyVariant(input.pokemon) ? 'Shiny' : null,
    input.facets.purified === true ? 'Purified' : null,
    input.facets.gender,
    input.facets.size ? String(input.facets.size).toUpperCase() : null,
    input.facets.lucky === true ? 'Lucky' : null,
    input.facets.appraisal === '4-star' ? '100%' : null,
  ].filter(Boolean);

  return labels.length === 0 ? getVariantLabel(input.pokemon) : labels.join(' ');
}

function getFacetCombinationOptions(pokemon: PokemonVariant): PokedexRegistrationFacets[] {
  const genderOptions = getGenderOptions(pokemon);
  const genderFacets = [
    {},
    ...genderOptions.map((gender): PokedexRegistrationFacets => ({ gender })),
  ];
  const sizeFacets: PokedexRegistrationFacets[] = [
    {},
    { size: 'xxs' },
    { size: 'xs' },
    { size: 'xl' },
    { size: 'xxl' },
  ];
  const luckyFacets: PokedexRegistrationFacets[] = isShadowVariant(pokemon)
    ? [{}]
    : [{}, { lucky: true }];
  const perfectFacets: PokedexRegistrationFacets[] = [{}, { appraisal: '4-star' }];
  const combinations: PokedexRegistrationFacets[] = [];

  for (const genderFacet of genderFacets) {
    for (const sizeFacet of sizeFacets) {
      for (const luckyFacet of luckyFacets) {
        for (const perfectFacet of perfectFacets) {
          combinations.push({
            ...genderFacet,
            ...sizeFacet,
            ...luckyFacet,
            ...perfectFacet,
          });
        }
      }
    }
  }

  return combinations;
}

function getRegistrationCombos(input: {
  selectedSlot: PokedexRegistrationSlot | undefined;
  variants: PokemonVariant[];
  registrations: PokedexRegistrationEntry[];
}): PokedexRegistrationCombo[] {
  if (!input.selectedSlot) return [];

  const comboVariants = getRelatedComboVariants(
    input.selectedSlot.pokemon,
    input.variants,
    input.selectedSlot.section !== 'primary',
  );
  const slotFacets = input.selectedSlot.facets ?? {};

  return comboVariants.flatMap((pokemon) =>
    getFacetCombinationOptions(pokemon).map((facets) => {
      const mergedFacets = { ...slotFacets, ...facets };
      const registration = getRegistration(input.registrations, pokemon, mergedFacets);

      return {
        key: getSlotRegistrationId(pokemon, mergedFacets),
        label: getComboLabel({ pokemon, facets: mergedFacets }),
        pokemon,
        facets: mergedFacets,
        purifiedImage: mergedFacets.purified === true,
        badges: getComboRegistrationBadges({ pokemon, facets: mergedFacets }),
        registered: registration?.is_registered === true,
      };
    }),
  );
}

function isComboRootSlot(slot: PokedexRegistrationSlot): boolean {
  return slot.section !== 'primary' || !slot.facets;
}

function getComboRootSlots(slots: PokedexRegistrationSlot[]): PokedexRegistrationSlot[] {
  const seenVariantFamilies = new Set<string>();

  return slots.filter((slot) => {
    if (!isComboRootSlot(slot)) return false;
    if (slot.section === 'primary') return true;

    const familyKey = `${slot.section}:${getVariantFamilyKey(slot.pokemon)}`;
    if (seenVariantFamilies.has(familyKey)) return false;

    seenVariantFamilies.add(familyKey);
    return true;
  });
}

function getComboRootKeyForSlot(
  slot: PokedexRegistrationSlot | undefined,
  rootSlots: PokedexRegistrationSlot[],
): string | null {
  if (!slot) return null;

  const exactRoot = rootSlots.find((rootSlot) => rootSlot.key === slot.key);
  if (exactRoot) return exactRoot.key;

  if (slot.section === 'primary') return null;

  const familyRoot = rootSlots.find(
    (rootSlot) =>
      rootSlot.section === slot.section &&
      getVariantFamilyKey(rootSlot.pokemon) === getVariantFamilyKey(slot.pokemon),
  );

  return familyRoot?.key ?? null;
}

function normalizeSearchTerm(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function getComboSearchText(combo: PokedexRegistrationCombo): string {
  const labels = [
    combo.label,
    getDisplayName(combo.pokemon),
    getSpeciesName(combo.pokemon),
    getVariantLabel(combo.pokemon),
    combo.pokemon.variantType,
    combo.pokemon.form,
    combo.facets.gender,
    combo.facets.size,
    combo.facets.lucky === true ? 'lucky' : null,
    combo.facets.appraisal === '4-star' ? '100 perfect hundo 4-star' : null,
    isShinyVariant(combo.pokemon) ? 'shiny' : 'pokemon base normal',
    combo.registered ? 'registered' : 'missing',
    ...combo.badges.map((badge) => badge.label),
  ];

  return labels.map(normalizeSearchTerm).filter(Boolean).join(' ');
}

function comboMatchesFilterKey(
  combo: PokedexRegistrationCombo,
  key: PokedexComboFilterKey,
): boolean {
  switch (key) {
    case 'registered':
      return combo.registered;
    case 'missing':
      return !combo.registered;
    case 'pokemon':
      return !isShinyVariant(combo.pokemon);
    case 'shiny':
      return isShinyVariant(combo.pokemon);
    case 'male':
      return combo.facets.gender === 'Male';
    case 'female':
      return combo.facets.gender === 'Female';
    case 'xxs':
    case 'xs':
    case 'xl':
    case 'xxl':
      return combo.facets.size === key;
    case 'lucky':
      return combo.facets.lucky === true;
    case 'perfect':
      return combo.facets.appraisal === '4-star';
    default:
      return true;
  }
}

function groupComboFilterKeys(activeFilterKeys: PokedexComboFilterKey[]) {
  return activeFilterKeys.reduce(
    (groups, key) => {
      const filter = COMBO_FILTERS.find((option) => option.key === key);
      if (!filter) return groups;

      groups[filter.group] = [...(groups[filter.group] ?? []), key];
      return groups;
    },
    {} as Partial<Record<PokedexComboFilterGroup, PokedexComboFilterKey[]>>,
  );
}

function comboMatchesActiveFilters(
  combo: PokedexRegistrationCombo,
  activeFilterKeys: PokedexComboFilterKey[],
): boolean {
  const groupedFilters = groupComboFilterKeys(activeFilterKeys);

  return (Object.entries(groupedFilters) as [
    PokedexComboFilterGroup,
    PokedexComboFilterKey[],
  ][]).every(([group, keys]) => {
    if (keys.length === 0) return true;
    if (group === 'quality') return keys.every((key) => comboMatchesFilterKey(combo, key));
    return keys.some((key) => comboMatchesFilterKey(combo, key));
  });
}

function comboMatchesSearch(combo: PokedexRegistrationCombo, search: string): boolean {
  const tokens = normalizeSearchTerm(search).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const searchText = getComboSearchText(combo);
  return tokens.every((token) => searchText.includes(token));
}

function filterRegistrationCombos(
  combos: PokedexRegistrationCombo[],
  search: string,
  activeFilterKeys: PokedexComboFilterKey[],
): PokedexRegistrationCombo[] {
  return combos.filter(
    (combo) =>
      comboMatchesSearch(combo, search) &&
      comboMatchesActiveFilters(combo, activeFilterKeys),
  );
}

function getRegistrationSlots(
  pokemon: PokemonVariant,
  variants: PokemonVariant[],
  registrations: PokedexRegistrationEntry[],
): PokedexRegistrationSlot[] {
  const speciesVariants = sortSpeciesVariants(
    variants.filter((variant) => variant.pokemon_id === pokemon.pokemon_id),
  );
  const defaultVariant =
    speciesVariants.find(
      (variant) => getVariantCategory(variant) === 'pokemon' && variant.form === pokemon.form,
    ) ??
    speciesVariants.find((variant) => getVariantCategory(variant) === 'pokemon') ??
    pokemon;
  const findVariant = (category: string) =>
    speciesVariants.find((variant) => getVariantCategory(variant) === category);
  const shinyVariant = findVariant('shiny');
  const shadowVariant = findVariant('shadow');
  const shinyShadowVariant = findVariant('shiny shadow');
  const hasShadowAvailability = speciesVariants.some((variant) =>
    getVariantCategory(variant).includes('shadow'),
  );
  const costumeVariants = sortVariantsByFamilyThenShiny(
    speciesVariants.filter((variant) =>
      ['costume', 'shiny costume', 'shadow costume'].includes(getVariantCategory(variant)),
    ),
  );
  const megaVariants = sortVariantsByFamilyThenShiny(
    speciesVariants.filter((variant) =>
      ['mega', 'shiny mega'].includes(getVariantCategory(variant)),
    ),
  );
  const maxVariants = sortVariantsByFamilyThenShiny(
    speciesVariants.filter((variant) =>
      ['dynamax', 'shiny dynamax', 'gigantamax', 'shiny gigantamax'].includes(
        getVariantCategory(variant),
      ),
    ),
  );
  const fusionVariants = sortVariantsByFamilyThenShiny(
    speciesVariants.filter((variant) =>
      ['fusion', 'shiny fusion'].includes(getVariantCategory(variant)),
    ),
  );

  const primarySlots: PokedexRegistrationSlot[] = [
    createSlot({
      key: `variant:${defaultVariant.variant_id}`,
      label: 'Pokemon',
      section: 'primary',
      pokemon: defaultVariant,
      registrations,
      icon: '/images/pokedex-icon.png',
    }),
    shinyVariant
      ? createSlot({
          key: `variant:${shinyVariant.variant_id}`,
          label: 'Shiny',
          section: 'primary',
          pokemon: shinyVariant,
          registrations,
        })
      : null,
    createSlot({
      key: `facet:perfect:${defaultVariant.variant_id}`,
      label: '100%',
      section: 'primary',
      pokemon: defaultVariant,
      registrations,
      facets: { appraisal: '4-star' },
      icon: '/images/appraisal_04.png',
    }),
    createSlot({
      key: `facet:lucky:${defaultVariant.variant_id}`,
      label: 'Lucky',
      section: 'primary',
      pokemon: defaultVariant,
      registrations,
      facets: { lucky: true },
      icon: '/images/lucky-icon.png',
    }),
    createSlot({
      key: `facet:xxl:${defaultVariant.variant_id}`,
      label: 'XXL',
      section: 'primary',
      pokemon: defaultVariant,
      registrations,
      facets: { size: 'xxl' },
      icon: '/images/xxl.png',
    }),
    createSlot({
      key: `facet:xxs:${defaultVariant.variant_id}`,
      label: 'XXS',
      section: 'primary',
      pokemon: defaultVariant,
      registrations,
      facets: { size: 'xxs' },
      icon: '/images/xxs.png',
    }),
  ].filter((slot): slot is PokedexRegistrationSlot => Boolean(slot));

  const shadowSlots: PokedexRegistrationSlot[] = [
    shadowVariant
      ? createSlot({
          key: `variant:${shadowVariant.variant_id}`,
          label: 'Shadow',
          section: 'shadow',
          pokemon: shadowVariant,
          registrations,
          icon: '/images/shadow_icon.png',
        })
      : null,
    shinyShadowVariant
      ? createSlot({
          key: `variant:${shinyShadowVariant.variant_id}`,
          label: 'Shiny Shadow',
          section: 'shadow',
          pokemon: shinyShadowVariant,
          registrations,
          icon: '/images/shadow_icon.png',
        })
      : null,
    hasShadowAvailability
      ? createSlot({
          key: `facet:purified:${defaultVariant.variant_id}`,
          label: 'Purified',
          section: 'shadow',
          pokemon: defaultVariant,
          registrations,
          facets: { purified: true },
          icon: '/images/purified.png',
          purifiedImage: true,
        })
      : null,
    shinyShadowVariant
      ? createSlot({
          key: `facet:shiny-purified:${shinyShadowVariant.variant_id}`,
          label: 'Shiny Purified',
          section: 'shadow',
          pokemon: shinyShadowVariant,
          registrations,
          facets: { purified: true },
          icon: '/images/purified.png',
          purifiedImage: true,
        })
      : null,
  ].filter((slot): slot is PokedexRegistrationSlot => Boolean(slot));

  return [
    ...primarySlots,
    ...costumeVariants.map((variant) =>
      createSlot({
        key: `costume:${variant.variant_id}`,
        label: getVariantLabel(variant),
        section: 'costume',
        pokemon: variant,
        registrations,
        icon: getVariantIcon(variant),
        iconPlacement: 'right',
        releaseDate: getVariantReleaseDate(variant),
      }),
    ),
    ...shadowSlots,
    ...megaVariants.map((variant) =>
      createSlot({
        key: `mega:${variant.variant_id}`,
        label: getVariantLabel(variant),
        section: 'mega',
        pokemon: variant,
        registrations,
        icon: getVariantIcon(variant),
        iconPlacement: 'right',
      }),
    ),
    ...maxVariants.map((variant) =>
      createSlot({
        key: `max:${variant.variant_id}`,
        label: getVariantLabel(variant),
        section: 'max',
        pokemon: variant,
        registrations,
        icon: getVariantIcon(variant),
        iconPlacement: 'right',
      }),
    ),
    ...fusionVariants.map((variant) =>
      createSlot({
        key: `fusion:${variant.variant_id}`,
        label: getVariantLabel(variant),
        section: 'fusion',
        pokemon: variant,
        registrations,
        icon: getVariantIcon(variant),
        iconPlacement: 'right',
      }),
    ),
  ];
}

function PokedexPokemonDetailCard({
  slot,
  gender,
  selected,
  onSelect,
  onToggleRegistration,
}: {
  slot: PokedexRegistrationSlot;
  gender?: PokedexGenderValue;
  selected: boolean;
  onSelect: () => void;
  onToggleRegistration?: () => void;
}) {
  return (
    <article
      className={`pokedex-pokemon-detail-card ${selected ? 'is-selected' : ''} ${
        slot.registered ? 'is-registered' : 'is-missing'
      } ${slot.releaseDate ? 'has-release-date' : ''}`}
    >
      <button className="pokedex-pokemon-detail-card__select" type="button" onClick={onSelect}>
        {slot.icon ? (
          <img
            className={`${getIconClassName('pokedex-pokemon-detail-card__icon', slot.icon)} ${
              slot.iconPlacement === 'right' ? 'pokedex-pokemon-detail-card__icon--right' : ''
            }`}
            src={slot.icon}
            alt=""
            draggable={false}
          />
        ) : null}
        <PokedexDetailPokemonImage
          className={getSizedImageClassName('pokedex-pokemon-detail-card__image', slot.facets)}
          pokemon={slot.pokemon}
          gender={gender}
          purified={slot.purifiedImage}
        />
        <span className="pokedex-pokemon-detail-card__label">{slot.label}</span>
        {slot.releaseDate ? (
          <span className="pokedex-pokemon-detail-card__date">
            {formatReleaseDate(slot.releaseDate)}
          </span>
        ) : null}
        <span className="pokedex-pokemon-detail-card__state">
          {slot.registered ? 'Registered' : 'Missing'}
        </span>
      </button>
      {onToggleRegistration ? (
        <button
          className="pokedex-pokemon-detail-card__registration-toggle"
          type="button"
          aria-label={`${slot.registered ? 'Clear' : 'Register'} ${slot.label}`}
          aria-pressed={slot.registered}
          onClick={onToggleRegistration}
        >
          {slot.registered ? '✓' : '+'}
        </button>
      ) : null}
    </article>
  );
}

function PokedexPokemonComboCard({
  combo,
  gender,
  onToggle,
}: {
  combo: PokedexRegistrationCombo;
  gender?: PokedexGenderValue;
  onToggle: () => void;
}) {
  const leftBadges = combo.badges.filter((badge) => badge.placement === 'left');
  const rightBadges = combo.badges.filter((badge) => badge.placement === 'right');
  const comboGender =
    combo.facets.gender === 'Male' || combo.facets.gender === 'Female'
      ? combo.facets.gender
      : gender;

  return (
    <button
      className={`pokedex-pokemon-combo-card ${combo.registered ? 'is-registered' : ''}`}
      type="button"
      aria-pressed={combo.registered}
      onClick={onToggle}
    >
      <div className="pokedex-pokemon-combo-card__image-frame">
        <PokedexDetailPokemonImage
          className={getSizedImageClassName('pokedex-pokemon-combo-card__image', combo.facets)}
          pokemon={combo.pokemon}
          gender={comboGender}
          purified={combo.purifiedImage}
        />
        {leftBadges.length > 0 ? (
          <span className="pokedex-pokemon-combo-card__badges pokedex-pokemon-combo-card__badges--left">
            {leftBadges.map((badge) =>
              badge.icon ? (
                <img
                  className={getIconClassName('pokedex-pokemon-combo-card__badge-icon', badge.icon)}
                  key={badge.key}
                  src={badge.icon}
                  alt={badge.label}
                  draggable={false}
                />
              ) : null,
            )}
          </span>
        ) : null}
        {rightBadges.length > 0 ? (
          <span className="pokedex-pokemon-combo-card__badges pokedex-pokemon-combo-card__badges--right">
            {rightBadges.map((badge) =>
              badge.icon ? (
                <img
                  className={getIconClassName('pokedex-pokemon-combo-card__badge-icon', badge.icon)}
                  key={badge.key}
                  src={badge.icon}
                  alt={badge.label}
                  draggable={false}
                />
              ) : null,
            )}
          </span>
        ) : null}
      </div>
      <span className="pokedex-pokemon-combo-card__label">{combo.label}</span>
      <span className="pokedex-pokemon-combo-card__state">
        {combo.registered ? 'Registered' : 'Missing'}
      </span>
    </button>
  );
}

function PokedexPokemonDetail({
  pokemon,
  variants,
  registrations,
  gender,
  onRegister,
  onUnregister,
  onClose,
}: PokedexPokemonDetailProps) {
  const [activeTab, setActiveTab] = useState<PokedexPokemonDetailTab>('registered');
  const [comboSearch, setComboSearch] = useState('');
  const [activeComboFilterKeys, setActiveComboFilterKeys] = useState<PokedexComboFilterKey[]>([]);
  const [openComboSectionKey, setOpenComboSectionKey] = useState<string | null>(null);
  const { confirm } = useModal();
  const slots = useMemo(
    () => getRegistrationSlots(pokemon, variants, registrations),
    [pokemon, registrations, variants],
  );
  const defaultSlot =
    slots.find(
      (slot) =>
        slot.section === 'primary' &&
        !slot.facets &&
        getVariantCategory(slot.pokemon) === 'pokemon',
    ) ??
    slots.find((slot) => !slot.facets) ??
    slots[0];
  const initialSlotKey = defaultSlot?.key ?? '';
  const [selectedSlotKey, setSelectedSlotKey] = useState(initialSlotKey);
  const [selectedGender, setSelectedGender] = useState<PokedexGenderValue | undefined>(gender);

  useEffect(() => {
    setSelectedSlotKey((current) =>
      slots.some((slot) => slot.key === current) ? current : initialSlotKey,
    );
  }, [initialSlotKey, slots]);

  const selectedSlot = slots.find((slot) => slot.key === selectedSlotKey) ?? slots[0];
  const comboRootSlots = useMemo(() => getComboRootSlots(slots), [slots]);
  const comboSections = useMemo(
    () =>
      comboRootSlots.map((slot) => {
        const sectionCombos = getRegistrationCombos({ selectedSlot: slot, variants, registrations });
        return {
          slot,
          combos: sectionCombos,
          registeredCount: sectionCombos.filter((combo) => combo.registered).length,
        };
      }),
    [comboRootSlots, registrations, variants],
  );
  const activeComboSection = comboSections.find(
    (section) => section.slot.key === openComboSectionKey,
  );
  const activeCombos = activeComboSection?.combos ?? EMPTY_REGISTRATION_COMBOS;
  const filteredCombos = useMemo(
    () => filterRegistrationCombos(activeCombos, comboSearch, activeComboFilterKeys),
    [activeComboFilterKeys, activeCombos, comboSearch],
  );
  const registeredSlotCount = slots.filter((slot) => slot.registered).length;
  const primarySlots = slots.filter((slot) => slot.section === 'primary');
  const costumeSlots = slots.filter((slot) => slot.section === 'costume');
  const shadowSlots = slots.filter((slot) => slot.section === 'shadow');
  const megaSlots = slots.filter((slot) => slot.section === 'mega');
  const maxSlots = slots.filter((slot) => slot.section === 'max');
  const fusionSlots = slots.filter((slot) => slot.section === 'fusion');
  const specialSlots = slots.filter((slot) => slot.section === 'special');
  const registeredSlotSections = [
    { key: 'registered', label: 'Registered', slots: primarySlots },
    { key: 'costumes', label: 'Costumes', slots: costumeSlots },
    { key: 'shadow', label: 'Shadow', slots: shadowSlots },
    { key: 'mega', label: 'Mega forms', slots: megaSlots },
    { key: 'max', label: 'Max forms', slots: maxSlots },
    { key: 'fusion', label: 'Fusion forms', slots: fusionSlots },
    { key: 'special', label: 'Other forms', slots: specialSlots },
  ].filter((section) => section.slots.length > 0);
  const heroSlot = selectedSlot ?? defaultSlot;
  const heroPokemon = heroSlot?.pokemon ?? pokemon;
  const heroThemeKey = getSlotThemeKey(heroSlot);
  const genderOptions = getGenderOptions(heroPokemon);
  const typeChips = getTypeChips(heroPokemon);
  const selectedSlotLabel =
    activeTab === 'more'
      ? activeComboSection?.slot.label ?? 'Index'
      : selectedSlot?.label ?? getDisplayName(pokemon);
  const canUseRegistrationActions = Boolean(onRegister && onUnregister);

  const handleSlotSelect = (slot: PokedexRegistrationSlot) => {
    setSelectedSlotKey(slot.key);
    setOpenComboSectionKey(getComboRootKeyForSlot(slot, comboRootSlots));
  };

  const handleRegisterSlots = (targetSlots: PokedexRegistrationSlot[]) => {
    if (!onRegister) return;
    void onRegister(targetSlots.map(createManualRegistrationForSlot));
  };

  const handleConfirmRegisterSlots = async (
    targetSlots: PokedexRegistrationSlot[],
    scopeLabel = 'this section',
  ) => {
    if (!onRegister || targetSlots.length === 0) return;

    const confirmed = await confirm(
      `Register all ${targetSlots.length} entries in ${scopeLabel}?\nThis will mark them as registered in your Pokedex.`,
    );
    if (!confirmed) return;

    handleRegisterSlots(targetSlots);
  };

  const handleUnregisterSlots = (targetSlots: PokedexRegistrationSlot[]) => {
    if (!onUnregister) return;
    void onUnregister(
      targetSlots.map((slot) => createManualRegistrationForSlot(slot).registration_id),
    );
  };

  const handleConfirmUnregisterSlots = async (
    targetSlots: PokedexRegistrationSlot[],
    scopeLabel = 'this section',
  ) => {
    if (!onUnregister || targetSlots.length === 0) return;

    const confirmed = await confirm(
      `Unregister all ${targetSlots.length} entries in ${scopeLabel}?\nThis only removes manual Pokedex registrations. Your caught Pokemon instances stay unchanged.`,
    );
    if (!confirmed) return;

    handleUnregisterSlots(targetSlots);
  };

  const handleToggleSlotRegistration = (slot: PokedexRegistrationSlot) => {
    if (slot.registered) {
      handleUnregisterSlots([slot]);
      return;
    }

    handleRegisterSlots([slot]);
  };

  const handleRegisterCombos = (combos: PokedexRegistrationCombo[]) => {
    if (!onRegister) return;
    void onRegister(combos.map(createManualRegistrationForCombo));
  };

  const handleConfirmRegisterCombos = async (combos: PokedexRegistrationCombo[]) => {
    if (!onRegister || combos.length === 0) return;

    const confirmed = await confirm(
      `Register all ${combos.length} shown combinations?\nThis applies to the currently open variant, search, and filters.`,
    );
    if (!confirmed) return;

    handleRegisterCombos(combos);
  };

  const handleUnregisterCombos = (combos: PokedexRegistrationCombo[]) => {
    if (!onUnregister) return;
    void onUnregister(combos.map((combo) => createManualRegistrationForCombo(combo).registration_id));
  };

  const handleConfirmUnregisterCombos = async (combos: PokedexRegistrationCombo[]) => {
    if (!onUnregister || combos.length === 0) return;

    const confirmed = await confirm(
      `Unregister all ${combos.length} shown combinations?\nThis only removes manual Pokedex registrations. Your caught Pokemon instances stay unchanged.`,
    );
    if (!confirmed) return;

    handleUnregisterCombos(combos);
  };

  const handleToggleCombo = (combo: PokedexRegistrationCombo) => {
    if (combo.registered) {
      handleUnregisterCombos([combo]);
      return;
    }

    handleRegisterCombos([combo]);
  };

  const handleComboFilterToggle = (filter: PokedexComboFilter) => {
    setActiveComboFilterKeys((current) => {
      if (current.includes(filter.key)) {
        return current.filter((key) => key !== filter.key);
      }

      const next = EXCLUSIVE_COMBO_FILTER_GROUPS.has(filter.group)
        ? current.filter(
            (key) => COMBO_FILTERS.find((option) => option.key === key)?.group !== filter.group,
          )
        : current;

      return [...next, filter.key];
    });
  };

  const clearComboIndex = () => {
    setComboSearch('');
    setActiveComboFilterKeys([]);
  };

  const handleComboSectionSelect = (section: PokedexComboSection) => {
    setSelectedSlotKey(section.slot.key);
    setOpenComboSectionKey((current) => (current === section.slot.key ? null : section.slot.key));
  };

  useEffect(() => {
    if (genderOptions.length === 0) {
      setSelectedGender(undefined);
      return;
    }

    setSelectedGender((current) => {
      if (current && genderOptions.includes(current)) return current;
      if (gender && genderOptions.includes(gender)) return gender;
      return genderOptions[0];
    });
  }, [gender, genderOptions]);

  useEffect(() => {
    setComboSearch('');
    setActiveComboFilterKeys([]);
  }, [openComboSectionKey]);

  useEffect(() => {
    if (
      openComboSectionKey &&
      !comboSections.some((section) => section.slot.key === openComboSectionKey)
    ) {
      setOpenComboSectionKey(null);
    }
  }, [comboSections, openComboSectionKey]);

  return (
    <div
      className={`pokedex-pokemon-detail pokedex-pokemon-detail--${heroThemeKey}`}
    >
      <div className="pokedex-pokemon-detail__shell">
        <section className="pokedex-pokemon-detail__hero">
          {heroSlot?.icon ? (
            <span
              className={`pokedex-pokemon-detail__hero-badge ${
                heroSlot.iconPlacement === 'right' ? 'pokedex-pokemon-detail__hero-badge--right' : ''
              }`}
              title={heroSlot.label}
            >
              <img
                className={getIconClassName('pokedex-pokemon-detail__hero-badge-icon', heroSlot.icon)}
                src={heroSlot.icon}
                alt=""
                draggable={false}
              />
            </span>
          ) : null}
          <PokedexDetailPokemonImage
            className={getSizedImageClassName('pokedex-pokemon-detail__hero-image', heroSlot?.facets)}
            pokemon={heroPokemon}
            gender={selectedGender}
            purified={heroSlot?.purifiedImage}
          />
          <h2 className="pokedex-pokemon-detail__name">
            <span className="pokedex-pokemon-detail__dex-mark">#</span>
            {formatDexNumber(pokemon)} {getSpeciesName(pokemon)}
          </h2>

          <div className="pokedex-pokemon-detail__traits" aria-label="Pokemon traits">
            {genderOptions.length > 0 ? (
              genderOptions.map((option) => (
                <button
                  className={`pokedex-pokemon-detail__gender pokedex-pokemon-detail__gender--${option.toLowerCase()} ${
                    selectedGender === option ? 'is-active' : ''
                  }`}
                  key={option}
                  type="button"
                  aria-pressed={selectedGender === option}
                  title={option}
                  onClick={() => setSelectedGender(option)}
                >
                  <img src={`/images/${option.toLowerCase()}-icon.png`} alt="" draggable={false} />
                </button>
              ))
            ) : (
              <span className="pokedex-pokemon-detail__genderless">Genderless</span>
            )}

            {typeChips.length > 0 ? (
              <span className="pokedex-pokemon-detail__trait-divider" aria-hidden="true" />
            ) : null}

            {typeChips.map((type) => (
              <span className="pokedex-pokemon-detail__type" key={type.label}>
                <img src={type.icon} alt="" draggable={false} />
                <span>{type.label}</span>
              </span>
            ))}
          </div>

          <div className="pokedex-pokemon-detail__registration-pill" aria-label="Registration summary">
            <div>
              <span>Registered</span>
              <strong>{registeredSlotCount}</strong>
            </div>
            <div>
              <span>Available</span>
              <strong>{slots.length}</strong>
            </div>
          </div>
        </section>

        <div className="pokedex-pokemon-detail__tabs" role="tablist" aria-label="Pokemon detail tabs">
          <button
            className={activeTab === 'registered' ? 'is-active' : ''}
            type="button"
            role="tab"
            aria-selected={activeTab === 'registered'}
            onClick={() => setActiveTab('registered')}
          >
            Registered
          </button>
          <button
            className={activeTab === 'info' ? 'is-active' : ''}
            type="button"
            role="tab"
            aria-selected={activeTab === 'info'}
            onClick={() => setActiveTab('info')}
          >
            Info
          </button>
          <button
            className={activeTab === 'battle' ? 'is-active' : ''}
            type="button"
            role="tab"
            aria-selected={activeTab === 'battle'}
            onClick={() => setActiveTab('battle')}
          >
            Battle
          </button>
          <button
            className={activeTab === 'more' ? 'is-active' : ''}
            type="button"
            role="tab"
            aria-selected={activeTab === 'more'}
            onClick={() => {
              setActiveTab('more');
              setOpenComboSectionKey(getComboRootKeyForSlot(selectedSlot, comboRootSlots));
            }}
          >
            <span className="pokedex-pokemon-detail__tab-main">More</span>
            <span className="pokedex-pokemon-detail__tab-detail">{selectedSlotLabel}</span>
          </button>
        </div>

        {activeTab === 'registered' ? (
          <div className="pokedex-pokemon-detail__registered">
            {canUseRegistrationActions ? (
              <div
                className="pokedex-pokemon-detail__registered-bulk-actions"
                aria-label="Registered tab bulk actions"
              >
                <button
                  className="pokedex-pokemon-detail__registered-bulk-action pokedex-pokemon-detail__registered-bulk-action--register"
                  type="button"
                  disabled={slots.length === 0}
                  onClick={() => void handleConfirmRegisterSlots(slots, 'the Registered tab')}
                >
                  Register all
                </button>
                <button
                  className="pokedex-pokemon-detail__registered-bulk-action pokedex-pokemon-detail__registered-bulk-action--unregister"
                  type="button"
                  disabled={slots.length === 0}
                  onClick={() => void handleConfirmUnregisterSlots(slots, 'the Registered tab')}
                >
                  Unregister all
                </button>
              </div>
            ) : null}
            {registeredSlotSections.map((section) => (
              <section className="pokedex-pokemon-detail__slot-section" key={section.key}>
                <header className="pokedex-pokemon-detail__slot-section-header">
                  <h3>{section.label}</h3>
                </header>
                <div className="pokedex-pokemon-detail__grid">
                  {section.slots.map((slot) => (
                    <PokedexPokemonDetailCard
                      key={slot.key}
                      slot={slot}
                      gender={selectedGender}
                      selected={slot.key === selectedSlot?.key}
                      onSelect={() => handleSlotSelect(slot)}
                      onToggleRegistration={
                        canUseRegistrationActions
                          ? () => handleToggleSlotRegistration(slot)
                          : undefined
                      }
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : activeTab === 'more' ? (
          <section className="pokedex-pokemon-detail__more">
            <header className="pokedex-pokemon-detail__more-header">
              <PokedexDetailPokemonImage
                className="pokedex-pokemon-detail__more-image"
                pokemon={activeComboSection?.slot.pokemon ?? selectedSlot?.pokemon ?? pokemon}
                gender={selectedGender}
                purified={activeComboSection?.slot.purifiedImage ?? selectedSlot?.purifiedImage}
              />
              <div>
                <h3>Variant combinations</h3>
                <p>
                  {activeComboSection
                    ? `${activeComboSection.registeredCount} / ${activeCombos.length}`
                    : `${comboSections.length} variants`}
                </p>
              </div>
            </header>

            <div className="pokedex-pokemon-detail__combo-sections">
              {comboSections.map((section) => {
                const isOpen = section.slot.key === openComboSectionKey;

                return (
                  <section
                    className={`pokedex-pokemon-detail__combo-section ${isOpen ? 'is-open' : ''}`}
                    key={section.slot.key}
                  >
                  <button
                    className="pokedex-pokemon-detail__combo-section-button"
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => handleComboSectionSelect(section)}
                  >
                    <PokedexDetailPokemonImage
                      className="pokedex-pokemon-detail__combo-section-image"
                      pokemon={section.slot.pokemon}
                      gender={selectedGender}
                      purified={section.slot.purifiedImage}
                    />
                    <span className="pokedex-pokemon-detail__combo-section-label">
                      {section.slot.label}
                    </span>
                    <span className="pokedex-pokemon-detail__combo-section-count">
                      {section.registeredCount} / {section.combos.length}
                    </span>
                  </button>

                  {isOpen ? (
                    <div className="pokedex-pokemon-detail__combo-section-body">
                      <div className="pokedex-pokemon-detail__combo-control-panel">
                        <div className="pokedex-pokemon-detail__combo-tools">
                          <label className="pokedex-pokemon-detail__combo-search">
                            <span>Search combinations</span>
                            <input
                              type="search"
                              value={comboSearch}
                              placeholder="Search shiny, female, XXL, lucky, 100%..."
                              onChange={(event) => setComboSearch(event.target.value)}
                            />
                          </label>

                          <div className="pokedex-pokemon-detail__combo-index-status" aria-live="polite">
                            <span>
                              Showing {filteredCombos.length} of {activeCombos.length}
                            </span>
                            {comboSearch || activeComboFilterKeys.length > 0 ? (
                              <button type="button" onClick={clearComboIndex}>
                                Clear
                              </button>
                            ) : null}
                          </div>

                          <div
                            className="pokedex-pokemon-detail__combo-filter-row"
                            aria-label="Combination filters"
                          >
                            {COMBO_FILTERS.map((filter) => (
                              <button
                                className={activeComboFilterKeys.includes(filter.key) ? 'is-active' : ''}
                                key={filter.key}
                                type="button"
                                aria-pressed={activeComboFilterKeys.includes(filter.key)}
                                onClick={() => handleComboFilterToggle(filter)}
                              >
                                {filter.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {canUseRegistrationActions ? (
                          <div
                            className="pokedex-pokemon-detail__combo-bulk-actions"
                            aria-label="Shown combination actions"
                          >
                            <button
                              className="pokedex-pokemon-detail__combo-bulk-action pokedex-pokemon-detail__combo-bulk-action--register"
                              type="button"
                              disabled={filteredCombos.length === 0}
                              onClick={() => void handleConfirmRegisterCombos(filteredCombos)}
                            >
                              Register all
                            </button>
                            <button
                              className="pokedex-pokemon-detail__combo-bulk-action pokedex-pokemon-detail__combo-bulk-action--unregister"
                              type="button"
                              disabled={filteredCombos.length === 0}
                              onClick={() => void handleConfirmUnregisterCombos(filteredCombos)}
                            >
                              Unregister all
                            </button>
                          </div>
                        ) : null}
                      </div>

                      {filteredCombos.length > 0 ? (
                        <div className="pokedex-pokemon-combo-grid">
                          {filteredCombos.map((combo) => (
                            <PokedexPokemonComboCard
                              key={combo.key}
                              combo={combo}
                              gender={selectedGender}
                              onToggle={() => handleToggleCombo(combo)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="pokedex-pokemon-detail__combo-empty">
                          No combinations match this index.
                        </div>
                      )}
                    </div>
                  ) : null}
                </section>
              );
            })}
            </div>
          </section>
        ) : activeTab === 'info' ? (
          <PokedexInfoTab
            pokemon={heroPokemon}
            variants={variants}
            gender={selectedGender}
            onShowMore={() => {
              setActiveTab('more');
              setOpenComboSectionKey(getComboRootKeyForSlot(selectedSlot, comboRootSlots));
            }}
          />
        ) : activeTab === 'battle' ? (
          <PokedexBattleTab pokemon={heroPokemon} />
        ) : null}
      </div>

      <CloseButton
        className="pokedex-pokemon-detail__close"
        onClick={onClose}
        title="Close Pokemon detail"
      />
    </div>
  );
}

export default PokedexPokemonDetail;
