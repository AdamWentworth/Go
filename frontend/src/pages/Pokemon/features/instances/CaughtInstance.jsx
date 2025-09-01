// CaughtInstance.jsx
import React, { useState, useEffect, useMemo } from 'react';
import './CaughtInstance.css';

// Contexts and Hooks
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useModal } from '@/contexts/ModalContext';
import useValidation from './hooks/useValidation';

// Components
import EditSaveComponent from '@/components/EditSaveComponent';

// Pokemon Components
import CP from '@/components/pokemonComponents/CP';
import FavoriteComponent from '@/components/pokemonComponents/Favorite';
import NameComponent from './components/Owned/NameComponent';
import LuckyComponent from './components/Owned/LuckyComponent';
import PurifyComponent from './components/Owned/PurifyComponent';
import Gender from '@/components/pokemonComponents/Gender';
import Weight from '@/components/pokemonComponents/Weight';
import Types from '@/components/pokemonComponents/Types';
import Height from '@/components/pokemonComponents/Height';
import Moves from '@/components/pokemonComponents/Moves';
import IV from '@/components/pokemonComponents/IV';
import LocationCaught from '@/components/pokemonComponents/LocationCaught';
import DateCaughtComponent from '@/components/pokemonComponents/DateCaught';
import BackgroundLocationCard from '@/components/pokemonComponents/BackgroundLocationCard';
import MegaComponent from './components/Owned/MegaComponent';
import Level from '@/components/pokemonComponents/Level';
import FusionComponent from './components/Owned/FusionComponent';
import FuseOverlay from './components/Owned/FuseOverlay';
import MaxComponent from './components/Owned/MaxComponent.jsx';
import MaxMovesComponent from "./components/Owned/MaxMovesComponent.jsx";

// Utilities and Constants
import { determineImageUrl } from '@/utils/imageHelpers';
import { calculateBaseStats } from '@/utils/calculateBaseStats';

// Hooks
import { useFusion } from './hooks/useFusion';
import { useCalculatedCP } from './hooks/useCalculatedCP';

const CaughtInstance = ({ pokemon, isEditable }) => {
  const updateDetails = useInstancesStore((s) => s.updateInstanceDetails);
  const { alert } = useModal();
  const { errors: validationErrors, validate, resetErrors } = useValidation();

  const [megaData, setMegaData] = useState({
    isMega: pokemon.instanceData.is_mega || false,
    mega: pokemon.instanceData.mega || false,
    megaForm: (pokemon.instanceData.mega && pokemon.megaEvolutions?.length > 0)
      ? (pokemon.instanceData.mega_form || pokemon.megaEvolutions[0].form)
      : null,
  });

  const {
    fusion,
    setFusion,
    handleFusionToggle,
    handleFuseProceed,
    handleUndoFusion,
  } = useFusion(pokemon, alert);

  const [originalFusedWith, setOriginalFusedWith] = useState(fusion.fusedWith);

  const [isFemale, setIsFemale] = useState(pokemon.instanceData.gender === 'Female');
  const [isLucky, setIsLucky] = useState(pokemon.instanceData.lucky);
  const [currentImage, setCurrentImage] = useState(determineImageUrl(isFemale, pokemon, megaData.isMega, megaData.megaForm));
  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState(pokemon.instanceData.nickname);
  const [cp, setCP] = useState(pokemon.instanceData.cp ? pokemon.instanceData.cp.toString() : '');
  const [isFavorite, setIsFavorite] = useState(pokemon.instanceData.favorite);
  const [gender, setGender] = useState(pokemon.instanceData.gender);
  const [weight, setWeight] = useState(Number(pokemon.instanceData.weight));
  const [height, setHeight] = useState(Number(pokemon.instanceData.height));
  const [moves, setMoves] = useState({
    fastMove: pokemon.instanceData.fast_move_id,
    chargedMove1: pokemon.instanceData.charged_move1_id,
    chargedMove2: pokemon.instanceData.charged_move2_id,
  });
  const [ivs, setIvs] = useState({
    Attack: pokemon.instanceData.attack_iv != null ? Number(pokemon.instanceData.attack_iv) : '',
    Defense: pokemon.instanceData.defense_iv != null ? Number(pokemon.instanceData.defense_iv) : '',
    Stamina: pokemon.instanceData.stamina_iv != null ? Number(pokemon.instanceData.stamina_iv) : '',
  });
  const areIVsEmpty =
    (ivs.Attack === '' || ivs.Attack === null) &&
    (ivs.Defense === '' || ivs.Defense === null) &&
    (ivs.Stamina === '' || ivs.Stamina === null);

  const [locationCaught, setLocationCaught] = useState(pokemon.instanceData.location_caught);
  const [dateCaught, setDateCaught] = useState(pokemon.instanceData.date_caught);
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [level, setLevel] = useState(pokemon.instanceData.level || null);
  const [isShadow, setIsShadow] = useState(!!pokemon.instanceData.shadow);
  const [isPurified, setIsPurified] = useState(!!pokemon.instanceData.purified);

  // Extract max moves
  const [maxAttack, setMaxAttack] = useState(pokemon.instanceData.max_attack || '');
  const [maxGuard, setMaxGuard] = useState(pokemon.instanceData.max_guard || '');
  const [maxSpirit, setMaxSpirit] = useState(pokemon.instanceData.max_spirit || '');
  const [showMaxOptions, setShowMaxOptions] = useState(false);

  const dynamax = !!pokemon.instanceData.dynamax;
  const gigantamax = !!pokemon.instanceData.gigantamax;

  const currentBaseStats = useMemo(
    () => calculateBaseStats(pokemon, megaData, fusion),
    [pokemon, megaData, fusion]
  );

  useCalculatedCP({ currentBaseStats, level, ivs, setCP });

  useEffect(() => {
    if (pokemon.instanceData.location_card !== null) {
      const locationCardId = parseInt(pokemon.instanceData.location_card, 10);
      const background = pokemon.backgrounds.find(bg => bg.background_id === locationCardId);
      if (background) setSelectedBackground(background);
    }
  }, [pokemon.backgrounds, pokemon.instanceData.location_card]);

  useEffect(() => {
    const updatedImage = determineImageUrl(
      isFemale,
      pokemon,
      megaData.isMega,
      megaData.megaForm,
      fusion.is_fused,
      fusion.fusion_form,
      isPurified,
      gigantamax
    );
    setCurrentImage(updatedImage);
  }, [isFemale, megaData.isMega, megaData.megaForm, fusion.is_fused, fusion.fusion_form, pokemon, isPurified, gigantamax]);

  const handleGenderChange = (g) => { setGender(g); setIsFemale(g === 'Female'); };
  const handleCPChange = (v) => setCP(v);
  const handleLuckyToggle = (v) => setIsLucky(v);
  const handleNicknameChange = (v) => setNickname(v);
  const handleFavoriteChange = (v) => setIsFavorite(v);
  const handleWeightChange = (v) => setWeight(Number(v));
  const handleHeightChange = (v) => setHeight(Number(v));
  const handleMovesChange = (v) => setMoves(v);
  const handleIvChange = (v) => setIvs(v);
  const handleLocationCaughtChange = (v) => setLocationCaught(v);
  const handleDateCaughtChange = (v) => setDateCaught(v);
  const handleLevelChange = (v) => setLevel(v !== '' ? Number(v) : null);

  const handlePurifyToggle = (v) => {
    if (v) { setIsPurified(true); setIsShadow(false); }
    else { setIsPurified(false); setIsShadow(true); }
  };

  const handleMaxAttackChange = (v) => setMaxAttack(v);
  const handleMaxGuardChange = (v) => setMaxGuard(v);
  const handleMaxSpiritChange = (v) => setMaxSpirit(v);
  const handleToggleMaxOptions = () => setShowMaxOptions(p => !p);

  useEffect(() => { if (!editMode) setShowMaxOptions(false); }, [editMode]);
  useEffect(() => { if (editMode) setOriginalFusedWith(fusion.fusedWith); }, [editMode]);

  const toggleEditMode = async () => {
    if (editMode) {
      const fieldsToValidate = {
        level,
        cp: cp !== '' ? Number(cp) : null,
        ivs,
        weight,
        height,
      };

      const { validationErrors, computedValues: newComputedValues } =
        validate(fieldsToValidate, currentBaseStats);

      const isValid = Object.keys(validationErrors).length === 0;
      if (!isValid) {
        const errorMessages = Object.values(validationErrors).join('\n');
        alert(errorMessages);
        return;
      }

      try {
        // Apply computed values locally if provided
        if (newComputedValues.level !== undefined) setLevel(newComputedValues.level);
        if (newComputedValues.cp !== undefined) setCP((newComputedValues.cp ?? '').toString());
        if (newComputedValues.ivs !== undefined) setIvs(newComputedValues.ivs);

        const changes = {};
        changes[pokemon.pokemonKey] = {
          nickname,
          lucky: isLucky,
          cp:
            newComputedValues.cp !== undefined
              ? newComputedValues.cp ?? null
              : cp !== '' ? Number(cp) : null,
          favorite: isFavorite,
          gender,
          weight,
          height,
          fast_move_id: moves.fastMove,
          charged_move1_id: moves.chargedMove1,
          charged_move2_id: moves.chargedMove2,
          attack_iv:
            newComputedValues.ivs !== undefined
              ? newComputedValues.ivs.Attack === '' ? null : newComputedValues.ivs.Attack
              : ivs.Attack === '' ? null : ivs.Attack,
          defense_iv:
            newComputedValues.ivs !== undefined
              ? newComputedValues.ivs.Defense === '' ? null : newComputedValues.ivs.Defense
              : ivs.Defense === '' ? null : ivs.Defense,
          stamina_iv:
            newComputedValues.ivs !== undefined
              ? newComputedValues.ivs.Stamina === '' ? null : newComputedValues.ivs.Stamina
              : ivs.Stamina === '' ? null : ivs.Stamina,
          location_caught: locationCaught,
          date_caught: dateCaught,
          location_card: selectedBackground ? selectedBackground.background_id : null,
          mega: megaData.mega,
          is_mega: megaData.isMega,
          mega_form: megaData.isMega ? megaData.megaForm : null,
          level:
            newComputedValues.level !== undefined ? newComputedValues.level : level,
          fusion: fusion.storedFusionObject,
          is_fused: fusion.is_fused,
          fused_with: fusion.fusedWith,
          fusion_form: fusion.fusion_form,
          shadow: isShadow,
          purified: isPurified,
          max_attack: maxAttack,
          max_guard: maxGuard,
          max_spirit: maxSpirit,
        };

        // Fusion partner updates
        const { is_fused, fusion_form, fusedWith: newFusedWith } = fusion;
        if (originalFusedWith && originalFusedWith !== newFusedWith) {
          changes[originalFusedWith] = {
            disabled: false,
            fused_with: null,
            is_fused: false,
            fusion_form: null,
          };
        }
        if (newFusedWith && is_fused && newFusedWith !== originalFusedWith) {
          changes[newFusedWith] = {
            disabled: true,
            fused_with: pokemon.pokemonKey,
            is_fused: true,
            fusion_form,
          };
        }

        await updateDetails(changes);
        resetErrors();
      } catch (err) {
        console.error('Error updating details:', err);
        alert('An error occurred while updating the Pokémon details. Please try again.');
        return;
      }
    }
    setEditMode(!editMode);
  };

  const handleBackgroundSelect = (background) => {
    setSelectedBackground(background);
    setShowBackgrounds(false);
  };

  const selectableBackgrounds = pokemon.backgrounds.filter((background) => {
    if (!background.costume_id) return true;
    const variantTypeId = pokemon.variantType.split('_')[1];
    return background.costume_id === parseInt(variantTypeId, 10);
  });

  return (
    <div className="caught-instance">
      <div className="top-row">
        <EditSaveComponent
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          isEditable={isEditable}
        />
        <div className="cp-component-container">
          <CP
            pokemon={pokemon}
            editMode={editMode}
            onCPChange={handleCPChange}
            cp={cp}
            errors={validationErrors}
          />
        </div>
        <FavoriteComponent
          pokemon={pokemon}
          editMode={editMode}
          onFavoriteChange={handleFavoriteChange}
        />
      </div>

      {selectableBackgrounds.length > 0 && (
        <div className={`background-select-row ${editMode ? 'active' : ''}`}>
          <img
            src={'/images/location.png'}
            alt="Background Selector"
            className="background-icon"
            onClick={editMode ? () => setShowBackgrounds(!showBackgrounds) : null}
          />
        </div>
      )}

      <div className="image-container">
        {selectedBackground && (
          <div className="background-container">
            <div
              className="background-image"
              style={{ backgroundImage: `url(${selectedBackground.image_url})` }}
            />
            <div className="brightness-overlay" />
          </div>
        )}

        <div className="pokemon-image-container">
          {isLucky && <img src={'/images/lucky.png'} alt="Lucky Backdrop" className="lucky-backdrop" />}
          <img src={currentImage} alt={pokemon.name} className="pokemon-image" />
          {dynamax && <img src={'/images/dynamax.png'} alt="Dynamax Badge" className="max-badge" />}
          {gigantamax && <img src={'/images/gigantamax.png'} alt="Gigantamax Badge" className="max-badge" />}
          {isPurified && <img src={'/images/purified.png'} alt="Purified Badge" className="purified-badge" />}
        </div>
      </div>

      <div className="purify-name-shadow-container">
        <LuckyComponent pokemon={pokemon} onToggleLucky={handleLuckyToggle} isLucky={isLucky} editMode={editMode} isShadow={isShadow}/>
        <NameComponent pokemon={pokemon} editMode={editMode} onNicknameChange={handleNicknameChange}/>
        <PurifyComponent isShadow={isShadow} isPurified={isPurified} editMode={editMode} onTogglePurify={handlePurifyToggle}/>
      </div>

      <div className="level-gender-row">
        <Level
          pokemon={pokemon}
          editMode={editMode}
          level={level}
          onLevelChange={handleLevelChange}
          errors={validationErrors}
        />
        {(editMode || (gender !== null && gender !== '')) && (
          <div className="gender-wrapper">
            <Gender pokemon={pokemon} editMode={editMode} onGenderChange={handleGenderChange} />
          </div>
        )}
      </div>

      <div className="weight-type-height-container">
        <Weight pokemon={pokemon} editMode={editMode} onWeightChange={handleWeightChange} />
        <Types pokemon={pokemon} />
        <Height pokemon={pokemon} editMode={editMode} onHeightChange={handleHeightChange} />
      </div>

      <FusionComponent
        fusion={pokemon.fusion}
        editMode={editMode}
        pokemon={pokemon}
        fusionState={fusion}
        onFusionToggle={handleFusionToggle}
        onUndoFusion={handleUndoFusion}
      />

      <div className="max-mega-container">
        <MaxComponent
          pokemon={pokemon}
          editMode={editMode}
          dynamax={dynamax}
          gigantamax={gigantamax}
          onToggleMax={handleToggleMaxOptions}
          showMaxOptions={showMaxOptions}
        />
        <MegaComponent
          megaData={megaData}
          setMegaData={setMegaData}
          editMode={editMode}
          megaEvolutions={pokemon.megaEvolutions}
          isShadow={isShadow}
          name={pokemon.name}
        />
      </div>

      <MaxMovesComponent
        pokemon={pokemon}
        editMode={editMode}
        showMaxOptions={showMaxOptions}
        setShowMaxOptions={setShowMaxOptions}
        maxAttack={maxAttack}
        maxGuard={maxGuard}
        maxSpirit={maxSpirit}
        handleMaxAttackChange={handleMaxAttackChange}
        handleMaxGuardChange={handleMaxGuardChange}
        handleMaxSpiritChange={handleMaxSpiritChange}
      />

      <div className="moves-content">
        <Moves
          pokemon={pokemon}
          editMode={editMode}
          onMovesChange={handleMovesChange}
          isShadow={isShadow}
          isPurified={isPurified}
        />
      </div>

      {(editMode || !areIVsEmpty) && (
        <div className="iv-component">
          <IV editMode={editMode} onIvChange={handleIvChange} ivs={ivs} />
        </div>
      )}

      <div className="location-caught-component">
        <LocationCaught pokemon={pokemon} editMode={editMode} onLocationChange={handleLocationCaughtChange} />
      </div>

      <div className="date-caught-component">
        <DateCaughtComponent pokemon={pokemon} editMode={editMode} onDateChange={handleDateCaughtChange} />
      </div>

      {showBackgrounds && (
        <div className="background-overlay" onClick={() => setShowBackgrounds(false)}>
          <div className="background-overlay-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowBackgrounds(false)}>Close</button>
            <BackgroundLocationCard
              pokemon={pokemon}
              onSelectBackground={handleBackgroundSelect}
            />
          </div>
        </div>
      )}

      {fusion.overlayPokemon && (
        <FuseOverlay
          pokemon={fusion.overlayPokemon}
          onClose={() => setFusion(prev => ({ ...prev, overlayPokemon: null }))}
          onFuse={handleFuseProceed}
        />
      )}
    </div>
  );
};

export default CaughtInstance;
