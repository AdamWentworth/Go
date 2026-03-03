import React, {
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

import { calculateBaseStats } from '@/utils/calculateBaseStats';
import {
  type MegaData as PersistMegaData,
  type FusionState as PersistFusionState,
} from './utils/buildInstanceChanges';
import {
  buildCaughtPersistPatchMap,
  resolveCaughtPersistValues,
} from './utils/caughtPersist';
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

type CaughtPokemon = PokemonVariant & {
  instanceData?: PokemonInstance;
};

interface CaughtInstanceProps {
  pokemon: CaughtPokemon;
  isEditable: boolean;
}

const CaughtInstance: React.FC<CaughtInstanceProps> = ({ pokemon, isEditable }) => {
  const instanceData: Partial<PokemonInstance> = pokemon.instanceData ?? {};
  const megaEvolutions: MegaEvolution[] = pokemon.megaEvolutions ?? [];
  const backgrounds: VariantBackground[] = pokemon.backgrounds ?? [];
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

  const { fusion, setFusion, handleFuseProceed } = useFusion(pokemon, alert);
  const [originalFusedWith, setOriginalFusedWith] = useState<string | null>(
    fusion.fusedWith ?? null,
  );

  const {
    gender,
    isFemale,
    nickname,
    isFavorite,
    isLucky,
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
    handleNicknameChange,
    handleFavoriteChange,
    handleWeightChange,
    handleHeightChange,
    handleMovesChange,
    handleIvChange,
    handleLocationCaughtChange,
    handleDateCaughtChange,
    handleLevelChange,
    handlePurifyToggle,
    handleMaxAttackChange,
    handleMaxGuardChange,
    handleMaxSpiritChange,
    handleToggleMaxOptions,
  } = useCaughtFormState({ instanceData });

  const dynamax = Boolean(instanceData.dynamax);
  const gigantamax = Boolean(instanceData.gigantamax);

  const {
    showBackgrounds,
    setShowBackgrounds,
    selectedBackground,
    handleBackgroundSelect,
    selectableBackgrounds,
  } = useBackgrounds(backgrounds, variantType, instanceData.location_card ?? null);

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
        selectedBackgroundId: selectedBackground?.background_id ?? null,
        megaData,
        fusion: persistFusion,
        isShadow,
        isPurified,
        maxAttack,
        maxGuard,
        maxSpirit,
        originalFusedWith,
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

  return (
    <div className="caught-instance">
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
        selectedBackground={selectedBackground}
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

      <MovesAndIV
        pokemon={pokemon}
        editMode={editMode}
        onMovesChange={handleMovesChange}
        isShadow={isShadow}
        isPurified={isPurified}
        ivs={ivs}
        onIvChange={handleIvChange}
        areIVsEmpty={areIVsEmpty}
      />

      <MetaPanel
        pokemon={pokemon}
        editMode={editMode}
        onLocationChange={handleLocationCaughtChange}
        onDateChange={handleDateCaughtChange}
      />

      <Modals
        showBackgrounds={showBackgrounds}
        setShowBackgrounds={setShowBackgrounds}
        pokemon={pokemon}
        onSelectBackground={handleBackgroundSelect}
        overlayPokemon={fusion.overlayPokemon}
        onCloseOverlay={() =>
          setFusion((prev) => ({ ...prev, overlayPokemon: null }))
        }
        onFuse={handleFuseProceed}
      />
    </div>
  );
};

export default CaughtInstance;
