import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
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

import { calculateBaseStats } from '@/utils/calculateBaseStats';
import {
  buildInstanceChanges,
  type IVs as InstanceIVs,
  type MovesState,
  type MegaData as PersistMegaData,
  type FusionState as PersistFusionState,
} from './utils/buildInstanceChanges';

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

  const [gender, setGender] = useState<string | null>(instanceData.gender ?? null);
  const [isFemale, setIsFemale] = useState<boolean>(instanceData.gender === 'Female');
  const [nickname, setNickname] = useState<string | null>(instanceData.nickname ?? null);
  const [isFavorite, setIsFavorite] = useState<boolean>(Boolean(instanceData.favorite));
  const [isLucky, setIsLucky] = useState<boolean>(Boolean(instanceData.lucky));

  const [cp, setCP] = useState<string>(instanceData.cp != null ? String(instanceData.cp) : '');
  const [weight, setWeight] = useState<number>(Number(instanceData.weight ?? 0));
  const [height, setHeight] = useState<number>(Number(instanceData.height ?? 0));
  const [level, setLevel] = useState<number | null>(
    instanceData.level != null ? Number(instanceData.level) : null,
  );

  const [moves, setMoves] = useState<MovesState>({
    fastMove: instanceData.fast_move_id ?? null,
    chargedMove1: instanceData.charged_move1_id ?? null,
    chargedMove2: instanceData.charged_move2_id ?? null,
  });

  const [ivs, setIvs] = useState<InstanceIVs>({
    Attack: instanceData.attack_iv != null ? Number(instanceData.attack_iv) : '',
    Defense: instanceData.defense_iv != null ? Number(instanceData.defense_iv) : '',
    Stamina: instanceData.stamina_iv != null ? Number(instanceData.stamina_iv) : '',
  });

  const areIVsEmpty = useMemo(
    () => ivs.Attack === '' && ivs.Defense === '' && ivs.Stamina === '',
    [ivs],
  );

  const [locationCaught, setLocationCaught] = useState<string | null>(
    instanceData.location_caught ?? null,
  );
  const [dateCaught, setDateCaught] = useState<string | null>(instanceData.date_caught ?? null);

  const [isShadow, setIsShadow] = useState<boolean>(Boolean(instanceData.shadow));
  const [isPurified, setIsPurified] = useState<boolean>(Boolean(instanceData.purified));

  const [maxAttack, setMaxAttack] = useState<string>(String(instanceData.max_attack ?? ''));
  const [maxGuard, setMaxGuard] = useState<string>(String(instanceData.max_guard ?? ''));
  const [maxSpirit, setMaxSpirit] = useState<string>(String(instanceData.max_spirit ?? ''));
  const [showMaxOptions, setShowMaxOptions] = useState<boolean>(false);

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

  const handleGenderChange = useCallback((nextGender: string | null) => {
    setGender(nextGender);
    setIsFemale(nextGender === 'Female');
  }, []);
  const handleCPChange = useCallback((value: string) => setCP(value), []);
  const handleLuckyToggle = useCallback((value: boolean) => setIsLucky(value), []);
  const handleNicknameChange = useCallback((value: string | null) => setNickname(value), []);
  const handleFavoriteChange = useCallback((value: boolean) => setIsFavorite(value), []);
  const handleWeightChange = useCallback((value: string | number) => setWeight(Number(value)), []);
  const handleHeightChange = useCallback((value: string | number) => setHeight(Number(value)), []);
  const handleMovesChange = useCallback((value: MovesState) => {
    setMoves(value);
  }, []);
  const handleIvChange = useCallback(
    (value: { Attack: number | '' | null; Defense: number | '' | null; Stamina: number | '' | null }) =>
      setIvs({
        Attack: value.Attack ?? '',
        Defense: value.Defense ?? '',
        Stamina: value.Stamina ?? '',
      }),
    [],
  );
  const handleLocationCaughtChange = useCallback((value: string) => setLocationCaught(value), []);
  const handleDateCaughtChange = useCallback((value: string) => setDateCaught(value), []);
  const handleLevelChange = useCallback((value: string) => {
    setLevel(value !== '' ? Number(value) : null);
  }, []);
  const handlePurifyToggle = useCallback((value: boolean) => {
    if (value) {
      setIsPurified(true);
      setIsShadow(false);
      return;
    }
    setIsPurified(false);
    setIsShadow(true);
  }, []);
  const handleMaxAttackChange = useCallback((value: string) => setMaxAttack(value), []);
  const handleMaxGuardChange = useCallback((value: string) => setMaxGuard(value), []);
  const handleMaxSpiritChange = useCallback((value: string) => setMaxSpirit(value), []);
  const handleToggleMaxOptions = useCallback(() => setShowMaxOptions((prev) => !prev), []);

  const arcLayerRef = useRef<HTMLDivElement | null>(null);

  const recalcArcHeight = useCallback(() => {
    if (typeof window === 'undefined') return;

    const layer = arcLayerRef.current;
    if (!layer) return;

    const column = layer.closest('.caught-column') as HTMLElement | null;
    if (!column) return;

    const columnRect = column.getBoundingClientRect();
    const before = window.getComputedStyle(column, '::before');
    const panelTopPx = parseFloat(before.top) || 0;

    const css = window.getComputedStyle(layer);
    const baselineLift = parseFloat(css.getPropertyValue('--arc-baseline-offset')) || 6;
    const topGap = parseFloat(css.getPropertyValue('--arc-top-gap')) || 0;

    const baselineY = panelTopPx - baselineLift;

    const tops: number[] = [];
    const topRow = column.querySelector('.top-row') as HTMLElement | null;
    if (topRow) tops.push(topRow.getBoundingClientRect().bottom - columnRect.top);
    const bgRow = column.querySelector('.background-select-row') as HTMLElement | null;
    if (bgRow && bgRow.offsetParent !== null) {
      tops.push(bgRow.getBoundingClientRect().bottom - columnRect.top);
    }
    const headerBottomY = tops.length ? Math.max(...tops) : 0;

    const desired = Math.max(0, Math.round(baselineY - headerBottomY - topGap));
    layer.style.setProperty('--arc-height', `${desired}px`);
  }, []);

  useLayoutEffect(() => {
    recalcArcHeight();
  }, [recalcArcHeight]);

  useEffect(() => {
    const onResize = () => recalcArcHeight();
    window.addEventListener('resize', onResize);

    const layer = arcLayerRef.current;
    const column = layer?.closest('.caught-column') as HTMLElement | null;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(recalcArcHeight) : null;

    if (ro && column) {
      ro.observe(column);
      const topRow = column.querySelector('.top-row') as HTMLElement | null;
      const bgRow = column.querySelector('.background-select-row') as HTMLElement | null;
      if (topRow) ro.observe(topRow);
      if (bgRow) ro.observe(bgRow);
    }

    const timer = setTimeout(recalcArcHeight, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
    };
  }, [recalcArcHeight]);

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
      const computedCP = newComputedValues.cp ?? (cp !== '' ? Number(cp) : null);
      const computedLevel = newComputedValues.level ?? level;
      const computedIvs = newComputedValues.ivs ?? ivs;

      if (typeof newComputedValues.level === 'number') {
        setLevel(newComputedValues.level);
      }
      if (newComputedValues.cp !== undefined) {
        setCP(newComputedValues.cp == null ? '' : String(newComputedValues.cp));
      }
      if (newComputedValues.ivs) {
        setIvs(newComputedValues.ivs);
      }

      const persistFusion: PersistFusionState = {
        storedFusionObject: fusion.storedFusionObject,
        is_fused: fusion.is_fused,
        fusedWith: fusion.fusedWith,
        fusion_form: fusion.fusion_form,
      };

      const patchMap: Record<string, Partial<PokemonInstance>> = buildInstanceChanges({
        instanceId,
        nickname,
        isLucky,
        isFavorite,
        gender,
        weight,
        height,
        computedCP,
        computedLevel,
        moves,
        ivs: computedIvs,
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
      });

      if (originalFusedWith && originalFusedWith !== fusion.fusedWith) {
        patchMap[originalFusedWith] = {
          disabled: false,
          fused_with: null,
          is_fused: false,
          fusion_form: null,
        };
      }
      if (fusion.fusedWith && fusion.is_fused && fusion.fusedWith !== originalFusedWith) {
        patchMap[fusion.fusedWith] = {
          disabled: true,
          fused_with: instanceId,
          is_fused: true,
          fusion_form: fusion.fusion_form,
        };
      }

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
