import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import './CaughtInstance.css';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useModal } from '@/contexts/ModalContext';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { VariantBackground, MegaEvolution } from '@/types/pokemonSubTypes';

import useValidation from './hooks/useValidation';
import { useFusion } from './hooks/useFusion';
import { useCalculatedCP } from './hooks/useCalculatedCP';
import { useBackgrounds } from './hooks/useBackgrounds';
import { useSprite } from './hooks/useSprite';
import { useEditWorkflow } from './hooks/useEditWorkflow';
import { useArcHeight } from './hooks/useArcHeight';
import { createScopedLogger } from '@/utils/logger';

import { calculateBaseStats } from '@/utils/calculateBaseStats';
import {
  type MegaData as PersistMegaData,
  type FusionState as PersistFusionState,
} from './utils/buildInstanceChanges';
import {
  buildCaughtPersistPatchMap,
  resolveCaughtPersistValues,
} from './utils/caughtPersist';
import {
  resolveFusionMovePool,
  type FusionMoveSource,
} from './utils/resolveFusionMovePool';
import { resolveFusionBackgroundPool } from './utils/resolveFusionBackgroundPool';
import { resolveFusionComboBackground } from './utils/resolveFusionComboBackground';
import { useCaughtFormState } from './hooks/useCaughtFormState';

import HeaderRow from './sections/HeaderRow';
import BackgroundSelector from './sections/BackgroundSelector';
import ImageStage from './sections/ImageStage';
import LevelArc from './components/Caught/LevelArc';
import IdentityRow from './sections/IdentityRow';
import LevelGenderRow from './sections/LevelGenderRow';
import StatsRow from './sections/StatsRow';
import PowerPanel from './sections/PowerPanel';
import MovesAndIV from './sections/MovesAndIV';
import MetaPanel from './sections/MetaPanel';
import Modals from './sections/Modals';
import CaughtDateRibbon from './sections/CaughtDateRibbon';
import FusionComponent from './components/Caught/FusionComponent';

type CaughtPokemon = PokemonVariant & {
  instanceData?: PokemonInstance;
};

type MovesPreviewPokemon = {
  moves?: CaughtPokemon['moves'];
  fusion?: CaughtPokemon['fusion'];
  instanceData?: Partial<PokemonInstance>;
};

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

interface CaughtInstanceProps {
  pokemon: CaughtPokemon;
  isEditable: boolean;
  onPreviewInstanceDataChange?: (patch: Partial<PokemonInstance>) => void;
  activeInstanceIdHint?: string | null;
}

const CaughtInstance: React.FC<CaughtInstanceProps> = ({
  pokemon,
  isEditable,
  onPreviewInstanceDataChange,
  activeInstanceIdHint = null,
}) => {
  const log = useMemo(() => createScopedLogger('caughtInstance.fusionMoves'), []);
  const instanceData: Partial<PokemonInstance> = pokemon.instanceData ?? {};
  const megaEvolutions: MegaEvolution[] = pokemon.megaEvolutions ?? [];
  const name = String(pokemon.name ?? pokemon.species_name ?? 'Pokemon');
  const variantType = pokemon.variantType;
  const variantId = pokemon.variant_id;
  const instanceId = String(instanceData.instance_id ?? variantId ?? '');

  const updateDetails = useInstancesStore((s) => s.updateInstanceDetails);
  const { alert } = useModal();
  const { validate, resetErrors } = useValidation();

  const [megaData, setMegaData] = useState<PersistMegaData>({
    isMega: Boolean(instanceData.is_mega),
    mega: Boolean(instanceData.mega),
    megaForm:
      instanceData.mega && megaEvolutions.length > 0
        ? String(instanceData.mega_form ?? megaEvolutions[0]?.form ?? '')
        : null,
  });

  const { fusion, setFusion, handleFuseProceed, handleFusionToggle, handleUndoFusion } = useFusion(
    pokemon,
    alert,
    activeInstanceIdHint,
  );
  const resolvedFusionBackgrounds = useMemo(
    () =>
      resolveFusionBackgroundPool({
        pokemon,
        fusion: {
          is_fused: fusion.is_fused,
          fusion_form: fusion.fusion_form,
          storedFusionObject: fusion.storedFusionObject,
        },
      }),
    [fusion.fusion_form, fusion.is_fused, fusion.storedFusionObject, pokemon],
  );
  const backgrounds: VariantBackground[] = resolvedFusionBackgrounds.backgrounds;
  const fusedPartnerInstance = useInstancesStore((state) => {
    const fusedWithKey = typeof fusion.fusedWith === 'string' ? fusion.fusedWith : null;
    if (!fusedWithKey) return null;

    const refs = collectInstanceRefCandidates(fusedWithKey);
    if (refs.length === 0) return null;

    const fromOwned = findInstanceByRefs(state.instances, refs);
    if (fromOwned) return fromOwned;
    return findInstanceByRefs(state.foreignInstances, refs);
  });

  const [originalFusedWith, setOriginalFusedWith] = useState<string | null>(
    fusion.fusedWith ?? null,
  );

  const {
    gender,
    isFemale,
    nickname,
    isFavorite,
    isLucky,
    isTraded,
    cp,
    setCP,
    weight,
    height,
    level,
    moves,
    ivs,
    areIVsEmpty,
    locationCaught,
    dateCaught,
    originalTrainerName,
    originalTrainerId,
    tradedDate,
    pokeball,
    isShadow,
    isPurified,
    maxAttack,
    maxGuard,
    maxSpirit,
    showMaxOptions,
    applyComputedValues,
    handleGenderChange,
    handleCPChange,
    handleLuckyToggle,
    handleIsTradedChange,
    handleNicknameChange,
    handleFavoriteChange,
    handleWeightChange,
    handleHeightChange,
    handleMovesChange,
    handleIvChange,
    handleLocationCaughtChange,
    handleDateCaughtChange,
    handleOriginalTrainerNameChange,
    handleOriginalTrainerIdChange,
    handleTradedDateChange,
    handlePokeballChange,
    handleLevelChange,
    handlePurifyToggle,
    handleMaxAttackChange,
    handleMaxGuardChange,
    handleMaxSpiritChange,
    handleToggleMaxOptions,
  } = useCaughtFormState({ instanceData });

  const dynamax = Boolean(instanceData.dynamax);
  const gigantamax = Boolean(instanceData.gigantamax);

  useEffect(() => {
    onPreviewInstanceDataChange?.({
      shadow: isShadow,
      purified: isPurified,
      lucky: isLucky,
    });
  }, [isShadow, isPurified, isLucky, onPreviewInstanceDataChange]);

  const {
    showBackgrounds,
    setShowBackgrounds,
    selectedBackground,
    handleBackgroundSelect,
    selectableBackgrounds,
  } = useBackgrounds(backgrounds, variantType, instanceData.location_card ?? null);

  const effectiveSelectedBackground = useMemo(() => {
    const fallbackSelectedFromLocationCard = (() => {
      const locationCardId = parseBackgroundId(instanceData.location_card);
      if (locationCardId == null) return null;
      return (
        backgrounds.find((background) => background.background_id === locationCardId) ?? null
      );
    })();

    const currentSelected = selectedBackground ?? fallbackSelectedFromLocationCard;

    if (!fusion.is_fused) return currentSelected;

    const ownBackgroundId = currentSelected?.background_id ?? null;
    const partnerBackgroundId = parseBackgroundId(fusedPartnerInstance?.location_card);

    const comboBackground = resolveFusionComboBackground({
      pokemonId: pokemon.pokemon_id,
      fusionEntries: pokemon.fusion ?? [],
      resolvedFusionId: resolvedFusionBackgrounds.fusionId,
      fusionForm: fusion.fusion_form,
      ownBackgroundId,
      partnerBackgroundId,
      availableBackgrounds: backgrounds,
    });

    return comboBackground ?? currentSelected;
  }, [
    backgrounds,
    fusedPartnerInstance?.location_card,
    fusion.fusion_form,
    fusion.is_fused,
    instanceData.location_card,
    pokemon.fusion,
    pokemon.pokemon_id,
    resolvedFusionBackgrounds.fusionId,
    selectedBackground,
  ]);

  const currentBaseStats = useMemo(
    () =>
      calculateBaseStats(
        pokemon,
        {
          isMega: megaData.isMega,
          megaForm: megaData.megaForm ?? undefined,
        },
        {
          is_fused: fusion.is_fused,
          fusion_form: fusion.fusion_form ?? undefined,
        },
      ),
    [pokemon, megaData.isMega, megaData.megaForm, fusion.is_fused, fusion.fusion_form],
  );

  const currentImage = useSprite({
    isFemale,
    pokemon,
    isMega: megaData.isMega,
    megaForm: megaData.megaForm,
    isFused: fusion.is_fused,
    fusionForm: fusion.fusion_form,
    isPurified,
    gigantamax,
  });

  useCalculatedCP({ currentBaseStats, level, ivs, setCP });

  const { arcLayerRef, recalcArcHeight } = useArcHeight();

  const { editMode, toggleEditMode } = useEditWorkflow({
    validate: (payload, baseStats) => {
      const result = validate(
        {
          level: payload.level ?? undefined,
          cp: payload.cp ?? undefined,
          ivs: {
            Attack: payload.ivs.Attack === '' ? undefined : payload.ivs.Attack,
            Defense: payload.ivs.Defense === '' ? undefined : payload.ivs.Defense,
            Stamina: payload.ivs.Stamina === '' ? undefined : payload.ivs.Stamina,
          },
        },
        baseStats as { attack: number; defense: number; stamina: number },
      );
      return {
        validationErrors: result.validationErrors as Record<string, string | undefined>,
        computedValues: result.computedValues,
      };
    },
    currentBaseStats,
    alert,
    onPersist: async ({ newComputedValues }) => {
      const { computedCP, computedLevel, computedIvs } = resolveCaughtPersistValues({
        cp,
        level,
        ivs,
        newComputedValues,
      });
      applyComputedValues(newComputedValues);

      const persistFusion: PersistFusionState = {
        storedFusionObject: fusion.storedFusionObject,
        is_fused: fusion.is_fused,
        fusedWith: fusion.fusedWith,
        fusion_form: fusion.fusion_form,
      };

      const patchMap = buildCaughtPersistPatchMap({
        instanceId,
        nickname,
        isLucky,
        isTraded,
        isFavorite,
        gender,
        weight,
        height,
        computedCP,
        computedLevel,
        computedIvs,
        moves,
        locationCaught,
        dateCaught,
        originalTrainerName,
        originalTrainerId,
        tradedDate,
        pokeball,
        selectedBackgroundId: effectiveSelectedBackground?.background_id ?? null,
        megaData,
        fusion: persistFusion,
        isShadow,
        isPurified,
        maxAttack,
        maxGuard,
        maxSpirit,
        originalFusedWith,
        allInstances: useInstancesStore.getState().instances,
      });

      await updateDetails(patchMap);
      resetErrors();
      recalcArcHeight();
    },
    onStartEditing: () => setOriginalFusedWith(fusion.fusedWith ?? null),
  });

  const handleToggleEditClick = useCallback(async () => {
    await toggleEditMode({
      level,
      cp: cp !== '' ? Number(cp) : null,
      ivs,
      weight,
      height,
    });
  }, [toggleEditMode, level, cp, ivs, weight, height]);

  const resolvedFusionMoves = useMemo(
    () =>
      resolveFusionMovePool({
        pokemon,
        fusion: {
          is_fused: fusion.is_fused,
          fusion_form: fusion.fusion_form,
          storedFusionObject: fusion.storedFusionObject,
        },
      }),
    [fusion.fusion_form, fusion.is_fused, fusion.storedFusionObject, pokemon],
  );

  const movesPokemon = useMemo<MovesPreviewPokemon>(
    () => {
      return {
        ...pokemon,
        moves: resolvedFusionMoves.moves,
        instanceData: {
          ...(pokemon.instanceData ?? {}),
          fusion_form: fusion.fusion_form,
          is_fused: fusion.is_fused,
          fast_move_id: moves.fastMove,
          charged_move1_id: moves.chargedMove1,
          charged_move2_id: moves.chargedMove2,
        },
      };
    },
    [
      fusion.fusion_form,
      fusion.is_fused,
      moves.chargedMove1,
      moves.chargedMove2,
      moves.fastMove,
      pokemon,
      resolvedFusionMoves.moves,
    ],
  );

  const fusionMoveMeta = useMemo<{ source: FusionMoveSource; isFused: boolean }>(
    () => ({
      source: resolvedFusionMoves.source,
      isFused: Boolean(fusion.is_fused),
    }),
    [fusion.is_fused, resolvedFusionMoves.source],
  );

  useEffect(() => {
    if (fusionMoveMeta.source !== 'fusion_missing') return;

    const fusionEntries = Array.isArray(pokemon.fusion) ? pokemon.fusion : [];
    log.warn('fusion moves unavailable in caught overlay', {
      variantId,
      instanceId,
      isFused: fusion.is_fused,
      fusionForm: fusion.fusion_form ?? null,
      storedFusionKeys: Object.keys(fusion.storedFusionObject ?? {}),
      selectedFusionId: resolvedFusionMoves.fusionId,
      fusionEntries: fusionEntries.map((entry) => ({
        fusion_id: entry?.fusion_id ?? null,
        name: entry?.name ?? null,
        moveCount: Array.isArray(entry?.moves) ? entry.moves.length : 0,
      })),
    });
  }, [
    fusion.is_fused,
    fusion.fusion_form,
    fusion.storedFusionObject,
    fusionMoveMeta.source,
    instanceId,
    log,
    pokemon.fusion,
    resolvedFusionMoves.fusionId,
    variantId,
  ]);

  const canRenderMegaPower = Boolean(
    megaEvolutions.length > 0 &&
      !isShadow &&
      !name.toLowerCase().includes('clone'),
  );

  const hasMaxVariant =
    typeof variantType === 'string' &&
    (variantType.includes('dynamax') || variantType.includes('gigantamax'));

  const canRenderMaxPower = Boolean(
    editMode &&
      hasMaxVariant &&
      Array.isArray(pokemon.max) &&
      pokemon.max.length > 0 &&
      !isShadow &&
      !isPurified &&
      !variantType?.includes('costume'),
  );

  const fusionOptionCount = useMemo(
    () =>
      (pokemon.fusion ?? []).filter(
        (item) =>
          item.base_pokemon_id1 === pokemon.pokemon_id &&
          typeof item.fusion_id === 'number',
      ).length,
    [pokemon.fusion, pokemon.pokemon_id],
  );

  const canRenderFusionPower = Boolean(fusion.is_fused || fusionOptionCount > 0);
  const showPowerSectionDivider = Boolean(
    canRenderMegaPower || canRenderMaxPower || canRenderFusionPower,
  );

  return (
    <div className="caught-instance">
      <CaughtDateRibbon dateCaught={dateCaught} />

      <HeaderRow
        editMode={editMode}
        toggleEditMode={handleToggleEditClick}
        isEditable={isEditable}
        cp={cp}
        isFavorite={isFavorite}
        onCPChange={handleCPChange}
        onFavoriteChange={handleFavoriteChange}
      />

      <BackgroundSelector
        canPick={selectableBackgrounds.length > 0}
        editMode={editMode}
        onToggle={() => setShowBackgrounds((prev) => !prev)}
      />

      <div className="level-arc-layer" aria-hidden="true" ref={arcLayerRef}>
        <div className="level-arc-overlay">
          <LevelArc level={level ?? 1} fitToContainer />
        </div>
      </div>

      <ImageStage
        level={level ?? 1}
        selectedBackground={effectiveSelectedBackground}
        isLucky={isLucky}
        currentImage={currentImage || ''}
        name={name}
        dynamax={dynamax}
        gigantamax={gigantamax}
        isPurified={isPurified}
      />

      <IdentityRow
        pokemon={pokemon}
        isLucky={isLucky}
        isShadow={isShadow}
        isPurified={isPurified}
        editMode={editMode}
        onToggleLucky={handleLuckyToggle}
        onNicknameChange={handleNicknameChange}
        onTogglePurify={handlePurifyToggle}
      />

      <LevelGenderRow
        pokemon={pokemon}
        editMode={editMode}
        level={level}
        onLevelChange={handleLevelChange}
        gender={gender}
        onGenderChange={handleGenderChange}
      />

      <StatsRow
        pokemon={pokemon}
        editMode={editMode}
        onWeightChange={handleWeightChange}
        onHeightChange={handleHeightChange}
      />

      <div className="caught-stats-divider" aria-hidden="true" />

      <PowerPanel
        pokemon={pokemon}
        editMode={editMode}
        megaData={megaData}
        setMegaData={setMegaData}
        megaEvolutions={megaEvolutions}
        isShadow={isShadow}
        name={name}
        dynamax={dynamax}
        gigantamax={gigantamax}
        showMaxOptions={showMaxOptions}
        onToggleMax={handleToggleMaxOptions}
        maxAttack={maxAttack}
        maxGuard={maxGuard}
        maxSpirit={maxSpirit}
        onMaxAttackChange={handleMaxAttackChange}
        onMaxGuardChange={handleMaxGuardChange}
        onMaxSpiritChange={handleMaxSpiritChange}
      />

      <div className="caught-fusion-slot">
        <FusionComponent
          fusion={pokemon.fusion ?? null}
          editMode={editMode}
          pokemon={pokemon}
          onFusionToggle={handleFusionToggle}
          onUndoFusion={handleUndoFusion}
          fusionState={fusion}
        />
      </div>

      {showPowerSectionDivider ? (
        <div className="caught-power-divider" aria-hidden="true" />
      ) : null}

      <MovesAndIV
        pokemon={movesPokemon}
        editMode={editMode}
        onMovesChange={handleMovesChange}
        isShadow={isShadow}
        isPurified={isPurified}
        fusionMoveSource={fusionMoveMeta.source}
        isFused={fusionMoveMeta.isFused}
        ivs={ivs}
        onIvChange={handleIvChange}
        areIVsEmpty={areIVsEmpty}
      />

      <MetaPanel
        pokemon={pokemon}
        editMode={editMode}
        pokeball={pokeball}
        originalTrainerName={originalTrainerName}
        originalTrainerId={originalTrainerId}
        tradedDate={tradedDate}
        isLucky={isLucky}
        isTraded={isTraded}
        isShadow={isShadow}
        onLocationChange={handleLocationCaughtChange}
        onDateChange={handleDateCaughtChange}
        onIsTradedChange={handleIsTradedChange}
        onOriginalTrainerNameChange={handleOriginalTrainerNameChange}
        onOriginalTrainerIdChange={handleOriginalTrainerIdChange}
        onTradedDateChange={handleTradedDateChange}
        onPokeballChange={handlePokeballChange}
      />

      <Modals
        showBackgrounds={showBackgrounds}
        setShowBackgrounds={setShowBackgrounds}
        pokemon={{
          variantType: pokemon.variantType,
          backgrounds,
        }}
        onSelectBackground={handleBackgroundSelect}
        overlayCandidates={fusion.overlayCandidates}
        overlayPokemon={fusion.overlayPokemon}
        onSelectOverlayPokemon={(selectedPokemon) =>
          setFusion((prev) => ({ ...prev, overlayPokemon: selectedPokemon }))
        }
        onCloseOverlay={() =>
          setFusion((prev) => ({ ...prev, overlayPokemon: null, overlayCandidates: [] }))
        }
        onFuse={handleFuseProceed}
      />
    </div>
  );
};

export default CaughtInstance;
