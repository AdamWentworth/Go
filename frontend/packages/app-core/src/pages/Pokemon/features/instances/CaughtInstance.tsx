import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import './CaughtInstance.css';

import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useModal } from '@/contexts/ModalContext';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { MegaEvolution } from '@/types/pokemonSubTypes';
import { getCrownFormLabel, resolveActiveCrownForm } from '@/utils/crownHelpers';

import useValidation from './hooks/useValidation';
import { useFusion } from './hooks/useFusion';
import { useCalculatedCP } from './hooks/useCalculatedCP';
import { useArcHeight } from './hooks/useArcHeight';
import { createScopedLogger } from '@/utils/logger';
import { resolvePokemonDisplayImageUrl } from '@/features/pokemonDisplay/pokemonDisplayPresentation';

import { calculateBaseStats } from '@/utils/calculateBaseStats';
import { type MegaData as PersistMegaData } from './utils/buildInstanceChanges';
import { useCaughtFormState } from './hooks/useCaughtFormState';
import { useCaughtInstanceBackgrounds } from './hooks/useCaughtInstanceBackgrounds';
import { useCaughtInstanceDisplayData } from './hooks/useCaughtInstanceDisplayData';
import { useCaughtInstanceEditWorkflow } from './hooks/useCaughtInstanceEditWorkflow';
import { useCaughtInstanceSectionVisibility } from './hooks/useCaughtInstanceSectionVisibility';

import PowerPanel from './sections/PowerPanel';
import Modals from './sections/Modals';
import InstanceDetailsLayout from './sections/InstanceDetailsLayout';
import FusionComponent from './components/Caught/FusionComponent';

type CaughtPokemon = PokemonVariant & {
  instanceData?: PokemonInstance;
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
  const crownForms = pokemon.crownForms ?? [];
  const name = String(pokemon.name ?? pokemon.species_name ?? 'Pokemon');
  const variantType = pokemon.variantType;
  const variantId = pokemon.variant_id;
  const instanceId = String(instanceData.instance_id ?? variantId ?? '');
  const variants = useVariantsStore((s) => s.variants);

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
  const [crownData, setCrownData] = useState<{
    isCrown: boolean;
    crownForm: string | null;
  }>(() => {
    const selected = resolveActiveCrownForm(crownForms, null);
    return {
      isCrown: Boolean(instanceData.crown),
      crownForm: getCrownFormLabel(selected),
    };
  });

  const { fusion, setFusion, handleFuseProceed, handleFusionToggle, handleUndoFusion } = useFusion(
    pokemon,
    alert,
    activeInstanceIdHint,
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
    backgrounds,
    showBackgrounds,
    setShowBackgrounds,
    handleBackgroundSelect,
    selectableBackgrounds,
    effectiveSelectedBackground,
  } = useCaughtInstanceBackgrounds({
    pokemon,
    variantType,
    locationCard: instanceData.location_card ?? null,
    fusion: {
      is_fused: fusion.is_fused,
      fusion_form: fusion.fusion_form,
      fusedWith: fusion.fusedWith,
      storedFusionObject: fusion.storedFusionObject,
    },
  });

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
        {
          is_crown: crownData.isCrown,
          crown_form: crownData.crownForm ?? undefined,
        },
      ),
    [
      pokemon,
      megaData.isMega,
      megaData.megaForm,
      fusion.is_fused,
      fusion.fusion_form,
      crownData.isCrown,
      crownData.crownForm,
    ],
  );

  const currentImage = useMemo(
    () =>
      resolvePokemonDisplayImageUrl({
        pokemon,
        attributes: {
          isFemale,
          isMega: megaData.isMega,
          megaForm: megaData.megaForm,
          isFused: fusion.is_fused,
          fusionForm: fusion.fusion_form,
          isPurified,
          isGigantamax: gigantamax,
          isCrown: crownData.isCrown,
          crownForm: crownData.crownForm,
        },
        crownForm: crownData.crownForm,
      }),
    [
      crownData.crownForm,
      crownData.isCrown,
      fusion.fusion_form,
      fusion.is_fused,
      gigantamax,
      isFemale,
      isPurified,
      megaData.isMega,
      megaData.megaForm,
      pokemon,
    ],
  );

  useCalculatedCP({ currentBaseStats, level, ivs, setCP });

  const { arcLayerRef, recalcArcHeight } = useArcHeight();

  const { editMode, handleToggleEditClick } = useCaughtInstanceEditWorkflow({
    instanceId,
    currentBaseStats,
    alert,
    validate,
    resetErrors,
    recalcArcHeight,
    applyComputedValues,
    cp,
    level,
    ivs,
    weight,
    height,
    nickname,
    isLucky,
    isTraded,
    isFavorite,
    gender,
    moves,
    locationCaught,
    dateCaught,
    originalTrainerName,
    originalTrainerId,
    tradedDate,
    pokeball,
    selectedBackgroundId: effectiveSelectedBackground?.background_id ?? null,
    megaData,
    crown: crownData.isCrown,
    fusion: {
      storedFusionObject: fusion.storedFusionObject,
      is_fused: fusion.is_fused,
      fusedWith: fusion.fusedWith,
      fusion_form: fusion.fusion_form,
    },
    isShadow,
    isPurified,
    maxAttack,
    maxGuard,
    maxSpirit,
  });

  const { resolvedFusionMoves, statsPokemon, movesPokemon, fusionMoveMeta } =
    useCaughtInstanceDisplayData({
      pokemon,
      variants,
      fusion: {
        is_fused: fusion.is_fused,
        fusion_form: fusion.fusion_form,
        storedFusionObject: fusion.storedFusionObject,
      },
      megaData,
      crownData,
      moves,
    });

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

  const {
    showPowerSectionDivider,
    metaPanelVisible,
    showStatsDivider,
    showMetaDivider,
    addStatsBottomGap,
  } = useCaughtInstanceSectionVisibility({
    pokemon,
    movesPokemon,
    megaEvolutionCount: megaEvolutions.length,
    crownFormCount: crownForms.length,
    pokemonName: name,
    variantType,
    maxCount: Array.isArray(pokemon.max) ? pokemon.max.length : 0,
    editMode,
    isShadow,
    isPurified,
    isFused: fusionMoveMeta.isFused,
    fusionMoveSource: fusionMoveMeta.source,
    areIVsEmpty,
    isTraded,
    originalTrainerName,
    tradedDate,
    pokeball,
  });

  return (
    <InstanceDetailsLayout
      className="caught-instance"
      dateCaught={dateCaught}
      headerRow={{
        editMode,
        toggleEditMode: handleToggleEditClick,
        isEditable,
        cp,
        isFavorite,
        onCPChange: handleCPChange,
        onFavoriteChange: handleFavoriteChange,
      }}
      backgroundSelector={{
        canPick: selectableBackgrounds.length > 0,
        editMode,
        onToggle: () => setShowBackgrounds((prev) => !prev),
      }}
      levelArcLevel={level}
      arcLayerRef={arcLayerRef}
      imageStage={{
        level: level ?? 1,
        selectedBackground: effectiveSelectedBackground,
        isLucky,
        currentImage: currentImage || '',
        name,
        dynamax,
        gigantamax,
        isPurified,
      }}
      identityRow={{
        pokemon,
        isLucky,
        isShadow,
        isPurified,
        editMode,
        onToggleLucky: handleLuckyToggle,
        onNicknameChange: handleNicknameChange,
        onTogglePurify: handlePurifyToggle,
      }}
      levelGenderRow={{
        pokemon,
        editMode,
        level,
        onLevelChange: handleLevelChange,
        gender,
        onGenderChange: handleGenderChange,
      }}
      statsRow={{
        pokemon: statsPokemon,
        editMode,
        onWeightChange: handleWeightChange,
        onHeightChange: handleHeightChange,
      }}
      addStatsBottomGap={addStatsBottomGap}
      showStatsDivider={showStatsDivider}
      powerContent={
        <PowerPanel
          pokemon={pokemon}
          editMode={editMode}
          megaData={megaData}
          setMegaData={setMegaData}
          megaEvolutions={megaEvolutions}
          crownData={crownData}
          setCrownData={setCrownData}
          crownForms={crownForms}
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
      }
      postPowerContent={
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
      }
      showPowerDivider={showPowerSectionDivider}
      showMetaPanel={metaPanelVisible}
      showMetaDivider={showMetaDivider}
      movesAndIV={{
        pokemon: movesPokemon,
        editMode,
        onMovesChange: handleMovesChange,
        isShadow,
        isPurified,
        fusionMoveSource: fusionMoveMeta.source,
        isFused: fusionMoveMeta.isFused,
        ivs,
        onIvChange: handleIvChange,
        areIVsEmpty,
      }}
      metaPanel={{
        pokemon,
        editMode,
        pokeball,
        originalTrainerName,
        originalTrainerId,
        tradedDate,
        isLucky,
        isTraded,
        isShadow,
        onLocationChange: handleLocationCaughtChange,
        onDateChange: handleDateCaughtChange,
        onIsTradedChange: handleIsTradedChange,
        onOriginalTrainerNameChange: handleOriginalTrainerNameChange,
        onOriginalTrainerIdChange: handleOriginalTrainerIdChange,
        onTradedDateChange: handleTradedDateChange,
        onPokeballChange: handlePokeballChange,
      }}
      footerContent={
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
      }
    />
  );
};

export default CaughtInstance;
