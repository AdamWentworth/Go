// CaughtInstance.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
} from 'react';
import './CaughtInstance.css';

// Contexts & Stores
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useModal } from '@/contexts/ModalContext';

// Hooks
import useValidation from './hooks/useValidation';
import { useFusion } from './hooks/useFusion';
import { useCalculatedCP } from './hooks/useCalculatedCP';
import { useBackgrounds } from './hooks/useBackgrounds';
import { useSprite } from './hooks/useSprite';
import { useEditWorkflow } from './hooks/useEditWorkflow';

// Utils
import { calculateBaseStats } from '@/utils/calculateBaseStats';
import { buildInstanceChanges } from './utils/buildInstanceChanges';

// Sections
import HeaderRow from './sections/HeaderRow';
import BackgroundSelector from './sections/BackgroundSelector';
import ImageStage from './sections/ImageStage';
import LevelArc from './components/Owned/LevelArc'; // full-width arc
import IdentityRow from './sections/IdentityRow';
import LevelGenderRow from './sections/LevelGenderRow';
import StatsRow from './sections/StatsRow';
import PowerPanel from './sections/PowerPanel';
import MovesAndIV from './sections/MovesAndIV';
import MetaPanel from './sections/MetaPanel';
import Modals from './sections/Modals';

const CaughtInstance = ({ pokemon, isEditable }) => {
  const {
    instanceData,
    megaEvolutions,
    backgrounds,
    name,
    variantType,
    pokemonKey,
  } = pokemon;

  const updateDetails = useInstancesStore((s) => s.updateInstanceDetails);
  const { alert } = useModal();
  const { errors: validationErrors, validate, resetErrors } = useValidation();

  // Mega
  const [megaData, setMegaData] = useState({
    isMega: instanceData.is_mega || false,
    mega: instanceData.mega || false,
    megaForm:
      instanceData.mega && megaEvolutions?.length > 0
        ? (instanceData.mega_form || megaEvolutions[0].form)
        : null,
  });

  // Fusion
  const {
    fusion,
    setFusion,
    handleFusionToggle,
    handleFuseProceed,
    handleUndoFusion,
  } = useFusion(pokemon, alert);
  const [originalFusedWith, setOriginalFusedWith] = useState(fusion.fusedWith);

  // Basics
  const [gender, setGender] = useState(instanceData.gender);
  const [isFemale, setIsFemale] = useState(instanceData.gender === 'Female');
  const [nickname, setNickname] = useState(instanceData.nickname);
  const [isFavorite, setIsFavorite] = useState(instanceData.favorite);
  const [isLucky, setIsLucky] = useState(instanceData.lucky);

  const [cp, setCP] = useState(instanceData.cp ? instanceData.cp.toString() : '');
  const [weight, setWeight] = useState(Number(instanceData.weight));
  const [height, setHeight] = useState(Number(instanceData.height));
  const [level, setLevel] = useState(instanceData.level || null);

  const [moves, setMoves] = useState({
    fastMove: instanceData.fast_move_id,
    chargedMove1: instanceData.charged_move1_id,
    chargedMove2: instanceData.charged_move2_id,
  });

  const [ivs, setIvs] = useState({
    Attack: instanceData.attack_iv != null ? Number(instanceData.attack_iv) : '',
    Defense: instanceData.defense_iv != null ? Number(instanceData.defense_iv) : '',
    Stamina: instanceData.stamina_iv != null ? Number(instanceData.stamina_iv) : '',
  });

  const areIVsEmpty = useMemo(
    () =>
      (ivs.Attack === '' || ivs.Attack === null) &&
      (ivs.Defense === '' || ivs.Defense === null) &&
      (ivs.Stamina === '' || ivs.Stamina === null),
    [ivs]
  );

  const [locationCaught, setLocationCaught] = useState(instanceData.location_caught);
  const [dateCaught, setDateCaught] = useState(instanceData.date_caught);

  const [isShadow, setIsShadow] = useState(!!instanceData.shadow);
  const [isPurified, setIsPurified] = useState(!!instanceData.purified);

  // Max options
  const [maxAttack, setMaxAttack] = useState(instanceData.max_attack || '');
  const [maxGuard, setMaxGuard] = useState(instanceData.max_guard || '');
  const [maxSpirit, setMaxSpirit] = useState(instanceData.max_spirit || '');
  const [showMaxOptions, setShowMaxOptions] = useState(false);

  const dynamax = !!instanceData.dynamax;
  const gigantamax = !!instanceData.gigantamax;

  // Backgrounds
  const {
    showBackgrounds,
    setShowBackgrounds,
    selectedBackground,
    handleBackgroundSelect,
    selectableBackgrounds,
  } = useBackgrounds(backgrounds, variantType, instanceData.location_card);

  // Base stats + sprite url
  const currentBaseStats = useMemo(
    () => calculateBaseStats(pokemon, megaData, fusion),
    [pokemon, megaData, fusion]
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

  // Handlers
  const handleGenderChange = useCallback((g) => {
    setGender(g);
    setIsFemale(g === 'Female');
  }, []);
  const handleCPChange = useCallback((v) => setCP(v), []);
  const handleLuckyToggle = useCallback((v) => setIsLucky(v), []);
  const handleNicknameChange = useCallback((v) => setNickname(v), []);
  const handleFavoriteChange = useCallback((v) => setIsFavorite(v), []);
  const handleWeightChange = useCallback((v) => setWeight(Number(v)), []);
  const handleHeightChange = useCallback((v) => setHeight(Number(v)), []);
  const handleMovesChange = useCallback((v) => setMoves(v), []);
  const handleIvChange = useCallback((v) => setIvs(v), []);
  const handleLocationCaughtChange = useCallback((v) => setLocationCaught(v), []);
  const handleDateCaughtChange = useCallback((v) => setDateCaught(v), []);
  const handleLevelChange = useCallback((v) => setLevel(v !== '' ? Number(v) : null), []);
  const handlePurifyToggle = useCallback((v) => {
    if (v) {
      setIsPurified(true);
      setIsShadow(false);
    } else {
      setIsPurified(false);
      setIsShadow(true);
    }
  }, []);
  const handleMaxAttackChange = useCallback((v) => setMaxAttack(v), []);
  const handleMaxGuardChange = useCallback((v) => setMaxGuard(v), []);
  const handleMaxSpiritChange = useCallback((v) => setMaxSpirit(v), []);
  const handleToggleMaxOptions = useCallback(() => setShowMaxOptions((p) => !p), []);

  // --- Arc sizing: lock baseline to panel top & clamp apex under header ---
  const arcLayerRef = useRef(null);

  const recalcArcHeight = useCallback(() => {
    if (typeof window === 'undefined') return;
    const layer = arcLayerRef.current;
    if (!layer) return;

    const column = layer.closest('.caught-column');
    if (!column) return;

    const columnRect = column.getBoundingClientRect();

    // panel top (relative to .caught-column), from ::before { top: var(--panel-offset) }
    const before = window.getComputedStyle(column, '::before');
    const panelTopPx = parseFloat(before.top) || 0;

    // baseline lift (arc endpoints sit a hair above the panel)
    const css = window.getComputedStyle(layer);
    const baselineLift = parseFloat(css.getPropertyValue('--arc-baseline-offset')) || 6;
    const topGap = parseFloat(css.getPropertyValue('--arc-top-gap')) || 0;

    const baselineY = panelTopPx - baselineLift; // px from column top

    // header bottom = bottom edge of the area above the arc (top-row plus optional background row)
    const tops = [];
    const topRow = column.querySelector('.top-row');
    if (topRow) tops.push(topRow.getBoundingClientRect().bottom - columnRect.top);
    const bgRow = column.querySelector('.background-select-row');
    if (bgRow && bgRow.offsetParent !== null) {
      tops.push(bgRow.getBoundingClientRect().bottom - columnRect.top);
    }
    const headerBottomY = tops.length ? Math.max(...tops) : 0;

    // desired arc "box" height = distance between header bottom and baseline (minus top gap)
    const desired = Math.max(0, Math.round(baselineY - headerBottomY - topGap));
    layer.style.setProperty('--arc-height', `${desired}px`);
  }, []);

  useLayoutEffect(() => {
    recalcArcHeight();
  }, [recalcArcHeight]);

  useEffect(() => {
    const onResize = () => recalcArcHeight();
    window.addEventListener('resize', onResize);

    // Resize observers for dynamic header changes
    const layer = arcLayerRef.current;
    const column = layer ? layer.closest('.caught-column') : null;
    const ro = 'ResizeObserver' in window ? new ResizeObserver(recalcArcHeight) : null;

    if (ro && column) {
      ro.observe(column);
      const topRow = column.querySelector('.top-row');
      const bgRow = column.querySelector('.background-select-row');
      if (topRow) ro.observe(topRow);
      if (bgRow) ro.observe(bgRow);
    }

    // settle after fonts/images
    const t = setTimeout(recalcArcHeight, 0);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
      if (ro) ro.disconnect();
    };
  }, [recalcArcHeight]);

  // Edit workflow (validate + persist)
  const { editMode, toggleEditMode } = useEditWorkflow({
    validate,
    currentBaseStats,
    alert,
    onPersist: async ({ newComputedValues }) => {
      const computedCP = newComputedValues.cp ?? (cp !== '' ? Number(cp) : null);
      const computedLevel = newComputedValues.level ?? level;
      const computedIvs = newComputedValues.ivs ?? ivs;

      // Apply locally
      if ('level' in newComputedValues) setLevel(newComputedValues.level);
      if ('cp' in newComputedValues) setCP((newComputedValues.cp ?? '').toString());
      if ('ivs' in newComputedValues) setIvs(newComputedValues.ivs);

      const base = buildInstanceChanges({
        pokemonKey,
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
        selectedBackgroundId: selectedBackground ? selectedBackground.background_id : null,
        megaData,
        fusion,
        isShadow,
        isPurified,
        maxAttack,
        maxGuard,
        maxSpirit,
      });

      const { is_fused, fusion_form, fusedWith: newFusedWith } = fusion;
      if (originalFusedWith && originalFusedWith !== newFusedWith) {
        base[originalFusedWith] = {
          disabled: false,
          fused_with: null,
          is_fused: false,
          fusion_form: null,
        };
      }
      if (newFusedWith && is_fused && newFusedWith !== originalFusedWith) {
        base[newFusedWith] = {
          disabled: true,
          fused_with: pokemonKey,
          is_fused: true,
          fusion_form,
        };
      }

      await updateDetails(base);
      resetErrors();
      // Recompute arc in case header content height changed after save
      recalcArcHeight();
    },
    onStartEditing: () => setOriginalFusedWith(fusion.fusedWith),
  });

  const handleToggleEditClick = useCallback(() => {
    return toggleEditMode({
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
        pokemon={pokemon}
        cp={cp}
        onCPChange={handleCPChange}
        errors={validationErrors}
        onFavoriteChange={handleFavoriteChange}
      />

      <BackgroundSelector
        canPick={selectableBackgrounds.length > 0}
        editMode={editMode}
        onToggle={() => setShowBackgrounds((v) => !v)}
      />

      {/* Full-width arc: baseline anchored to panel top; apex clamped under header */}
      <div className="level-arc-layer" aria-hidden="true" ref={arcLayerRef}>
        <div className="level-arc-overlay">
          <LevelArc level={level ?? 1} fitToContainer />
        </div>
      </div>

      <ImageStage
        level={level ?? 1}
        selectedBackground={selectedBackground}
        isLucky={isLucky}
        currentImage={currentImage}
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
        errors={validationErrors}
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
        onCloseOverlay={() => setFusion((prev) => ({ ...prev, overlayPokemon: null }))}
        onFuse={handleFuseProceed}
      />
    </div>
  );
};

export default CaughtInstance;
