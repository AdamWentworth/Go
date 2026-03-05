// PokemonCard.tsx
import { useEffect, useState, memo, useRef, useMemo } from 'react';
import CP from '@/components/pokemonComponents/CP';
import PokemonImagePresentation from './PokemonImagePresentation';
import './PokemonCard.css';
import { usePokemonCardTouchHandlers } from './hooks/usePokemonCardTouchHandlers';
import { usePokemonAttributes } from './hooks/usePokemonAttributes';
import { usePokemonImage } from './hooks/usePokemonImage';
import SelectChip from './SelectChip';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { resolveFusionBackgroundPool } from '@/pages/Pokemon/features/instances/utils/resolveFusionBackgroundPool';
import { resolveFusionComboBackground } from '@/pages/Pokemon/features/instances/utils/resolveFusionComboBackground';
import { getCrownFormLabel, resolveActiveCrownForm } from '@/utils/crownHelpers';

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { VariantBackground } from '@/types/pokemonSubTypes';

interface Props {
  pokemon: PokemonVariant & {
    instanceData?: Partial<PokemonInstance>;
    currentImage: string;
  };
  onSelect: () => void;
  onSwipe?: (direction: 'left' | 'right') => void;
  toggleCardHighlight: (key: string) => void;
  setIsFastSelectEnabled: (enabled: boolean) => void;
  isEditable: boolean;
  isFastSelectEnabled: boolean;
  isHighlighted: boolean;
  tagFilter: string;
  sortType: string;
  variantByPokemonId: Map<number, { backgrounds?: VariantBackground[] }>;
}

const UUID_AT_END_REGEX =
  /([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

const extractLegacyInstanceId = (key: string): string | null => {
  const idx = key.lastIndexOf('_');
  if (idx < 0 || idx >= key.length - 1) return null;
  const suffix = key.slice(idx + 1);
  return suffix || null;
};

const normalizeInstanceToken = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  const uuidMatch = trimmed.match(UUID_AT_END_REGEX);
  if (uuidMatch?.[1]) return uuidMatch[1];
  return trimmed;
};

const collectInstanceRefCandidates = (value: string | null): string[] => {
  if (!value) return [];
  const refs = new Set<string>();
  refs.add(value.toLowerCase());
  const legacy = extractLegacyInstanceId(value);
  if (legacy) refs.add(legacy.toLowerCase());
  const normalized = normalizeInstanceToken(value);
  if (normalized) refs.add(normalized.toLowerCase());
  return [...refs];
};

const findInstanceByRefs = (
  collection: Record<string, PokemonInstance> | null | undefined,
  refs: string[],
): PokemonInstance | null => {
  if (!collection || refs.length === 0) return null;
  const refSet = new Set(refs);

  for (const [key, row] of Object.entries(collection)) {
    const keyRefs = collectInstanceRefCandidates(key);
    if (keyRefs.some((ref) => refSet.has(ref))) return row;

    const rowInstanceId =
      typeof row?.instance_id === 'string' && row.instance_id.length > 0 ? row.instance_id : null;
    const rowRefs = collectInstanceRefCandidates(rowInstanceId);
    if (rowRefs.some((ref) => refSet.has(ref))) return row;
  }

  return null;
};

const parseBackgroundId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeFormToken = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

const buildTypeIcon = (typeName?: string | null): string | undefined => {
  const normalized = typeof typeName === 'string' ? typeName.trim().toLowerCase() : '';
  return normalized ? `/images/types/${normalized}.png` : undefined;
};

const normalizeTypeName = (value: string | null | undefined): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const parseFusionId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const PokemonCard = memo(({
  pokemon,
  onSelect,
  onSwipe,
  toggleCardHighlight,
  setIsFastSelectEnabled,
  isEditable,
  isFastSelectEnabled,
  isHighlighted,
  tagFilter = '',
  sortType,
  variantByPokemonId,
}: Props) => {
  const [shouldJiggle, setShouldJiggle] = useState(false);
  const prevIsHighlighted = useRef(isHighlighted);
  const {
    isDisabled, isFemale, isMega, megaForm,
    isFused, fusionForm, isCrown, isPurified, isDynamax, isGigantamax
  } = usePokemonAttributes(pokemon);
  const activeCrownForm = useMemo(
    () => resolveActiveCrownForm(pokemon.crownForms, undefined),
    [pokemon.crownForms],
  );
  const activeMegaEvolution = useMemo(() => {
    if (!isMega || !Array.isArray(pokemon.megaEvolutions) || pokemon.megaEvolutions.length === 0) {
      return undefined;
    }
    const normalizedForm = normalizeFormToken(megaForm);
    if (normalizedForm.length === 0) {
      return (
        pokemon.megaEvolutions.find((entry) => normalizeFormToken(entry.form) === '') ??
        pokemon.megaEvolutions[0]
      );
    }
    return (
      pokemon.megaEvolutions.find((entry) => normalizeFormToken(entry.form) === normalizedForm) ??
      pokemon.megaEvolutions[0]
    );
  }, [isMega, megaForm, pokemon.megaEvolutions]);
  const activeFusionEntry = useMemo(() => {
    if (!isFused || !Array.isArray(pokemon.fusion) || pokemon.fusion.length === 0) {
      return undefined;
    }
    const normalizedFusionForm = normalizeFormToken(fusionForm);
    if (normalizedFusionForm.length > 0) {
      return (
        pokemon.fusion.find((entry) => normalizeFormToken(entry.name) === normalizedFusionForm) ??
        pokemon.fusion[0]
      );
    }

    const storedFusion = pokemon.instanceData?.fusion as Record<string, unknown> | null | undefined;
    const storedFusionId =
      parseFusionId(storedFusion?.fusion_id) ??
      parseFusionId(storedFusion?.id);
    if (storedFusionId != null) {
      return (
        pokemon.fusion.find((entry) => entry.fusion_id === storedFusionId) ??
        pokemon.fusion[0]
      );
    }

    return pokemon.fusion[0];
  }, [fusionForm, isFused, pokemon.fusion, pokemon.instanceData?.fusion]);
  const displayTypeData = useMemo(() => {
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
  }, [
    activeFusionEntry,
    activeCrownForm,
    activeMegaEvolution,
    isFused,
    isCrown,
    isMega,
    pokemon.type1_name,
    pokemon.type2_name,
    pokemon.type_1_icon,
    pokemon.type_2_icon,
  ]);
  const fusedPartnerInstance = useInstancesStore((state) => {
    const fusedWithKey =
      typeof pokemon.instanceData?.fused_with === 'string' ? pokemon.instanceData.fused_with : null;
    if (!fusedWithKey) return null;

    const refs = collectInstanceRefCandidates(fusedWithKey);
    if (refs.length === 0) return null;

    const fromOwned = findInstanceByRefs(state.instances, refs);
    if (fromOwned) return fromOwned;
    return findInstanceByRefs(state.foreignInstances, refs);
  });
  const resolvedFusionBackgrounds = useMemo(
    () =>
      resolveFusionBackgroundPool({
        pokemon,
        fusion: {
          is_fused: Boolean(isFused),
          fusion_form: fusionForm ?? null,
          storedFusionObject:
            pokemon.instanceData && typeof pokemon.instanceData.fusion === 'object'
              ? (pokemon.instanceData.fusion as Record<string, unknown>)
              : null,
        },
      }),
    [fusionForm, isFused, pokemon],
  );

  useEffect(() => {
    if (prevIsHighlighted.current !== isHighlighted) {
      setShouldJiggle(true);
      const timer = setTimeout(() => setShouldJiggle(false), 300);
      return () => clearTimeout(timer);
    }
    prevIsHighlighted.current = isHighlighted;
  }, [isHighlighted]);

  const currentImage = usePokemonImage({
    pokemon,
    isDisabled,
    isFemale,
    isMega,
    megaForm,
    isFused,
    fusionForm,
    isCrown,
    crownForm: getCrownFormLabel(activeCrownForm) ?? undefined,
    isPurified,
    isGigantamax,
  });

  const getDisplayName = () => {
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

  // Prefer instance UUID, fallback to variant key
  const highlightKey = pokemon.instanceData?.instance_id ?? pokemon.variant_id;

  const { handleTouchStart, handleTouchMove, handleTouchEnd, handleClick } =
    usePokemonCardTouchHandlers({
      onSelect,
      onSwipe,
      toggleCardHighlight,
      setIsFastSelectEnabled,
      isEditable,
      isFastSelectEnabled,
      isDisabled,
      selectKey: highlightKey,
    });

  const getOwnershipClass = () => {
    const f = (tagFilter || '').toLowerCase();
    switch (f) {
      case 'caught': return 'caught';
      case 'trade': return 'trade';
      case 'wanted': return 'wanted';
      case 'missing': return 'missing';
      default: return '';
    }
  };

  const shouldDisplayLuckyBackdrop =
    (tagFilter.toLowerCase() === 'wanted' && pokemon.instanceData?.pref_lucky) ||
    pokemon.instanceData?.lucky;

  const locationBackground = useMemo(() => {
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
        const url = typeof rule.combo_background_image_url === 'string'
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
  }, [
    fusionForm,
    fusedPartnerInstance?.location_card,
    isFused,
    pokemon.backgrounds,
    pokemon.fusion,
    pokemon.instanceData?.location_card,
    pokemon.pokemon_id,
    resolvedFusionBackgrounds.backgrounds,
    resolvedFusionBackgrounds.fusionId,
    variantByPokemonId,
  ]);

  const cpValue =
    tagFilter !== ''
      ? (pokemon.instanceData?.cp ?? '')
      : (sortType === 'combatPower' && pokemon.cp50 != null ? pokemon.cp50 : '');

  const cardClass = `
    pokemon-card
    ${getOwnershipClass()}
    ${isHighlighted ? 'highlighted' : ''}
    ${isDisabled ? 'disabled-card' : ''}
    ${shouldJiggle ? 'jiggle' : ''}
  `.trim();

  // Modifier-click toggles selection on desktop; normal click opens details
  const handleCardClick = (e: React.MouseEvent) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      if (isEditable) {
        setIsFastSelectEnabled(true);
        toggleCardHighlight(highlightKey);
      }
      return;
    }
    handleClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ') {
      e.preventDefault();
      if (isEditable) {
        setIsFastSelectEnabled(true);
        toggleCardHighlight(highlightKey);
      }
    } else if (e.key === 'Enter') {
      onSelect();
    }
  };

  return (
    <div
      className={`${cardClass} ${isFastSelectEnabled ? 'hide-select-chip' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View ${pokemon.name} details`}
    >
      {/* Select chip (desktop hover only before fast-select is enabled) */}
      {isEditable && (
        <SelectChip
          selected={isHighlighted}
          delayMs={300}
          onToggle={() => {
            // enter fast-select only when selecting via chip
            if (!isHighlighted && !isFastSelectEnabled) {
              setIsFastSelectEnabled(true);
            }
            toggleCardHighlight(highlightKey);
          }}
        />
      )}

      <div className="cp-container">
        <CP cp={cpValue} editMode={false} onCPChange={() => {}} />
      </div>

      <div className="fav-container">
        {pokemon.instanceData?.favorite && (
          <img
            src="/images/fav_pressed.png"
            alt="Favorite"
            className="favorite-icon"
            draggable={false}
          />
        )}
      </div>

      <PokemonImagePresentation
        imageUrl={currentImage}
        altText={pokemon.name}
        locationBackground={locationBackground}
        shouldDisplayLuckyBackdrop={shouldDisplayLuckyBackdrop}
        isDynamax={isDynamax}
        isGigantamax={isGigantamax}
        isPurified={isPurified}
      />

      <p>#{pokemon.pokedex_number}</p>

      <div className="type-icons">
        {displayTypeData.type_1_icon && displayTypeData.type1_name && (
          <img
            src={displayTypeData.type_1_icon}
            alt={displayTypeData.type1_name}
            loading="lazy"
            draggable={false}
          />
        )}
        {displayTypeData.type_2_icon && displayTypeData.type2_name && (
          <img
            src={displayTypeData.type_2_icon}
            alt={displayTypeData.type2_name}
            loading="lazy"
            draggable={false}
          />
        )}
      </div>

      <h2 className="pokemon-name-display">{getDisplayName()}</h2>
    </div>
  );
});

export default PokemonCard;
