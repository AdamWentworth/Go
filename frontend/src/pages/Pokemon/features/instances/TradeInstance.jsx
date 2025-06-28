// TradeInstance.jsx

// TradeInstance.jsx – fixed version

import React, { useState, useContext, useEffect, useMemo } from 'react';
import './TradeInstance.css';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';

import EditSaveComponent from '@/components/EditSaveComponent';
import CP from '@/components/pokemonComponents/CP';
import NameComponent from './components/Owned/NameComponent';
import Gender from '@/components/pokemonComponents/Gender';
import Weight from '@/components/pokemonComponents/Weight';
import Types from '@/components/pokemonComponents/Types';
import Height from '@/components/pokemonComponents/Height';
import Moves from '@/components/pokemonComponents/Moves';
import LocationCaught from '@/components/pokemonComponents/LocationCaught';
import DateCaughtComponent from '@/components/pokemonComponents/DateCaught';
import BackgroundLocationCard from '@/components/pokemonComponents/BackgroundLocationCard';
import Level from '@/components/pokemonComponents/Level';
import IV from '@/components/pokemonComponents/IV';
import MaxComponent from './components/Owned/MaxComponent';
import MaxMovesComponent from './components/Owned/MaxMovesComponent';

import { determineImageUrl } from '@/utils/imageHelpers';

// --- 1) Import our validation hook and modal
import useValidation from './hooks/useValidation';
import { useModal } from '@/contexts/ModalContext';

import { cpMultipliers } from '@/utils/constants';
import { calculateCP } from '@/utils/calculateCP';

const TradeInstance = ({ pokemon, isEditable }) => {
  const updateDetails = useInstancesStore((s) => s.updateInstanceDetails);
  const { alert } = useModal(); // for showing validation errors

  // --- 2) Extract validation objects from our hook
  const {
    errors: validationErrors,
    validate,
    resetErrors,
    computedValues,
  } = useValidation();

  /* ------------------------------------------------------------------
   * LOCAL STATE ------------------------------------------------------
   * ----------------------------------------------------------------*/
  // Gender / Image
  const [isFemale, setIsFemale] = useState(
    pokemon.instanceData.gender === 'Female'
  );
  const [currentImage, setCurrentImage] = useState(
    determineImageUrl(isFemale, pokemon)
  );

  // Edit mode & core states
  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState(pokemon.instanceData.nickname);

  // We’ll store CP as a string so that editing is simpler. Convert to number on save.
  const [cp, setCP] = useState(
    pokemon.instanceData.cp != null ? pokemon.instanceData.cp.toString() : ''
  );

  const [gender, setGender] = useState(pokemon.instanceData.gender);
  const [weight, setWeight] = useState(
    Number(pokemon.instanceData.weight) || ''
  );
  const [height, setHeight] = useState(
    Number(pokemon.instanceData.height) || ''
  );

  const dynamax = !!pokemon.instanceData.dynamax;
  const gigantamax = !!pokemon.instanceData.gigantamax;
  const [showMaxOptions, setShowMaxOptions] = useState(false);

  // Extract max moves from instanceData
  const [maxAttack, setMaxAttack] = useState(
    pokemon.instanceData.max_attack || ''
  );
  const [maxGuard, setMaxGuard] = useState(
    pokemon.instanceData.max_guard || ''
  );
  const [maxSpirit, setMaxSpirit] = useState(
    pokemon.instanceData.max_spirit || ''
  );

  // Moves
  const [moves, setMoves] = useState({
    fastMove: pokemon.instanceData.fast_move_id,
    chargedMove1: pokemon.instanceData.charged_move1_id,
    chargedMove2: pokemon.instanceData.charged_move2_id,
  });

  // IVs & Level ------------------------------------------------------
  const [ivs, setIvs] = useState({
    Attack:
      pokemon.instanceData.attack_iv != null
        ? Number(pokemon.instanceData.attack_iv)
        : '',
    Defense:
      pokemon.instanceData.defense_iv != null
        ? Number(pokemon.instanceData.defense_iv)
        : '',
    Stamina:
      pokemon.instanceData.stamina_iv != null
        ? Number(pokemon.instanceData.stamina_iv)
        : '',
  });

  const areIVsEmpty =
    (ivs.Attack === '' || ivs.Attack === null) &&
    (ivs.Defense === '' || ivs.Defense === null) &&
    (ivs.Stamina === '' || ivs.Stamina === null);

  const [level, setLevel] = useState(
    pokemon.instanceData.level != null ? Number(pokemon.instanceData.level) : null
  );

  // location / date --------------------------------------------------
  const [locationCaught, setLocationCaught] = useState(
    pokemon.instanceData.location_caught
  );
  const [dateCaught, setDateCaught] = useState(
    pokemon.instanceData.date_caught
  );

  // Background-related ----------------------------------------------
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(null);

  /* ------------------------------------------------------------------
   * MEMOS & EFFECTS --------------------------------------------------
   * ----------------------------------------------------------------*/
  // 1. current base stats (for CP calculation)
  const currentBaseStats = useMemo(() => ({
    attack: Number(pokemon.attack),
    defense: Number(pokemon.defense),
    stamina: Number(pokemon.stamina),
  }), [pokemon]);

  // 2. pre-select background on mount
  useEffect(() => {
    if (pokemon.instanceData.location_card !== null) {
      const locationCardId = parseInt(pokemon.instanceData.location_card, 10);
      const background = pokemon.backgrounds.find(
        (bg) => bg.background_id === locationCardId
      );
      if (background) {
        setSelectedBackground(background);
      }
    }
  }, [pokemon.backgrounds, pokemon.instanceData.location_card]);

  // 3. recalc image whenever gender or gigantamax toggles
  useEffect(() => {
    setCurrentImage(
      determineImageUrl(
        isFemale,
        pokemon,
        false,
        undefined,
        false,
        undefined,
        false,
        gigantamax
      )
    );
  }, [isFemale, pokemon, gigantamax]);

  // 4. recalc CP when base stats, level or ivs change
  useEffect(() => {
    const { attack, defense, stamina } = currentBaseStats;
    const atk = ivs.Attack;
    const def = ivs.Defense;
    const sta = ivs.Stamina;

    if (
      level != null &&
      !isNaN(level) &&
      atk !== '' &&
      def !== '' &&
      sta !== '' &&
      !isNaN(atk) &&
      !isNaN(def) &&
      !isNaN(sta)
    ) {
      const multiplier = cpMultipliers[level];
      if (multiplier) {
        const calculatedCP = calculateCP(
          attack,
          defense,
          stamina,
          atk,
          def,
          sta,
          multiplier
        );
        setCP(calculatedCP.toString());
      }
    }
  }, [currentBaseStats, level, ivs]);

  /* ------------------------------------------------------------------
   * HANDLERS ---------------------------------------------------------
   * ----------------------------------------------------------------*/
  const handleGenderChange = (newGender) => {
    setGender(newGender);
    setIsFemale(newGender === 'Female');
  };
  const handleCPChange = (newCP) => setCP(newCP);
  const handleNicknameChange = (newNickname) => setNickname(newNickname);
  const handleWeightChange = (newWeight) => {
    setWeight(newWeight === '' ? '' : Number(newWeight));
  };
  const handleHeightChange = (newHeight) => {
    setHeight(newHeight === '' ? '' : Number(newHeight));
  };
  const handleMovesChange = (newMoves) => setMoves(newMoves);
  const handleIvChange = (newIvs) => setIvs(newIvs);
  const handleLevelChange = (newLevel) => {
    setLevel(newLevel !== '' ? Number(newLevel) : null);
  };
  const handleLocationCaughtChange = (newLocation) => setLocationCaught(newLocation);
  const handleDateCaughtChange = (newDate) => setDateCaught(newDate);
  const handleBackgroundSelect = (background) => {
    setSelectedBackground(background);
    setShowBackgrounds(false);
  };
  const handleToggleMaxOptions = () => setShowMaxOptions((p) => !p);

  /* ------------------------------------------------------------------
   * SAVE / EDIT TOGGLE ----------------------------------------------
   * ----------------------------------------------------------------*/
  const toggleEditMode = async () => {
    // leaving edit-mode ⇒ validate & save
    if (editMode) {
      // minimal set needed for validation hook
      const fieldsToValidate = {
        level,
        cp: cp !== '' ? Number(cp) : null,
        ivs,
        weight,
        height,
      };

      const { validationErrors: ve, computedValues: cv } = validate(
        fieldsToValidate,
        currentBaseStats
      );

      const hasErrors = Object.keys(ve).length > 0;
      if (hasErrors) {
        alert(Object.values(ve).join('\n'));
        return;
      }
      resetErrors();

      // merge any computed values back into local state before save
      if (cv.level !== undefined) setLevel(cv.level);
      if (cv.cp !== undefined) setCP(cv.cp.toString());
      if (cv.ivs !== undefined) setIvs(cv.ivs);

      // build payload -------------------------------------------------
      const payload = {
        nickname,
        cp: cp !== '' ? Number(cp) : null,
        gender,
        weight: weight === '' || isNaN(weight) ? null : weight,
        height: height === '' || isNaN(height) ? null : height,
        fast_move_id: moves.fastMove,
        charged_move1_id: moves.chargedMove1,
        charged_move2_id: moves.chargedMove2,
        level: cv.level ?? level,
        attack_iv: cv.ivs?.Attack ?? (ivs.Attack === '' ? null : ivs.Attack),
        defense_iv: cv.ivs?.Defense ?? (ivs.Defense === '' ? null : ivs.Defense),
        stamina_iv: cv.ivs?.Stamina ?? (ivs.Stamina === '' ? null : ivs.Stamina),
        location_caught: locationCaught,
        date_caught: dateCaught,
        location_card: selectedBackground?.background_id ?? null,
        max_attack: maxAttack,
        max_guard: maxGuard,
        max_spirit: maxSpirit,
      };

      try {
        await updateDetails({ [pokemon.pokemonKey]: payload });
      } catch (error) {
        console.error('Error updating trade details:', error);
        alert(
          'An error occurred while updating the Pokémon details. Please try again.'
        );
        return;
      }
    }

    // flip UI state ---------------------------------------------------
    setEditMode((prev) => !prev);
  };

  /* ------------------------------------------------------------------
   * RENDER -----------------------------------------------------------
   * ----------------------------------------------------------------*/
  return (
    <div className="trade-instance">
      <div className="trade-title"></div>
      <div className="top-row">
        <div className="edit-save-container">
          <EditSaveComponent
            editMode={editMode}
            toggleEditMode={toggleEditMode}
            isEditable={isEditable}
          />
        </div>
        <h2>Trade</h2>
      </div>

      {/* CP --------------------------------------------------------- */}
      <div className="CPComponent">
        <CP
          pokemon={pokemon}
          editMode={editMode}
          onCPChange={handleCPChange}
          cp={cp}
          errors={validationErrors}
        />
      </div>

      {/* BACKGROUND SELECTOR --------------------------------------- */}
      {pokemon.backgrounds.length > 0 && (
        <div
          className={`background-select-row ${editMode ? 'active' : ''}`}
        >
          <img
            src={'/images/location.png'}
            alt="Background Selector"
            className="background-icon"
            onClick={editMode ? () => setShowBackgrounds(!showBackgrounds) : null}
          />
        </div>
      )}

      {/* IMAGE ------------------------------------------------------ */}
      <div className="image-container">
        {selectedBackground && (
          <div className="background-container">
            <div
              className="background-image"
              style={{ backgroundImage: `url(${selectedBackground.image_url})` }}
            ></div>
            <div className="brightness-overlay"></div>
          </div>
        )}
        <div className="pokemon-image-container">
          <img
            src={currentImage}
            alt={pokemon.name}
            className="pokemon-image"
          />
          {dynamax && (
            <img src={'/images/dynamax.png'} alt="Dynamax Badge" className="max-badge" />
          )}
          {gigantamax && (
            <img
              src={'/images/gigantamax.png'}
              alt="Gigantamax Badge"
              className="max-badge"
            />
          )}
        </div>
      </div>

      {/* NAME ------------------------------------------------------- */}
      <div className="name-container">
        <NameComponent
          pokemon={pokemon}
          editMode={editMode}
          onNicknameChange={handleNicknameChange}
        />
      </div>

      {/* LEVEL + GENDER -------------------------------------------- */}
      <div className="level-gender-container">
        <Level
          pokemon={pokemon}
          editMode={editMode}
          level={level}
          onLevelChange={handleLevelChange}
          errors={validationErrors}
        />
        {(editMode || (gender !== null && gender !== '')) && (
          <div className="gender-wrapper">
            <Gender
              pokemon={pokemon}
              editMode={editMode}
              onGenderChange={handleGenderChange}
            />
          </div>
        )}
      </div>

      {/* STATS ------------------------------------------------------ */}
      <div className="stats-container">
        <Weight
          pokemon={pokemon}
          editMode={editMode}
          onWeightChange={handleWeightChange}
        />
        <Types pokemon={pokemon} />
        <Height
          pokemon={pokemon}
          editMode={editMode}
          onHeightChange={handleHeightChange}
        />
      </div>

      {/* DYNAMAX / G-MAX ------------------------------------------- */}
      <MaxComponent
        pokemon={pokemon}
        editMode={editMode}
        dynamax={dynamax}
        gigantamax={gigantamax}
        onToggleMax={handleToggleMaxOptions}
        showMaxOptions={showMaxOptions}
      />
      <MaxMovesComponent
        pokemon={pokemon}
        editMode={editMode}
        showMaxOptions={showMaxOptions}
        setShowMaxOptions={setShowMaxOptions}
        maxAttack={maxAttack}
        maxGuard={maxGuard}
        maxSpirit={maxSpirit}
        handleMaxAttackChange={setMaxAttack}
        handleMaxGuardChange={setMaxGuard}
        handleMaxSpiritChange={setMaxSpirit}
      />

      {/* MOVES ------------------------------------------------------ */}
      <div className="moves-container">
        <Moves
          pokemon={pokemon}
          editMode={editMode}
          onMovesChange={handleMovesChange}
        />
      </div>

      {/* IVs -------------------------------------------------------- */}
      {(editMode || !areIVsEmpty) && (
        <div className="iv-component">
          <IV editMode={editMode} onIvChange={handleIvChange} ivs={ivs} />
        </div>
      )}

      {/* LOCATION / DATE ------------------------------------------- */}
      <div className="location-container">
        <LocationCaught
          pokemon={pokemon}
          editMode={editMode}
          onLocationChange={handleLocationCaughtChange}
        />
      </div>
      <div className="date-container">
        <DateCaughtComponent
          pokemon={pokemon}
          editMode={editMode}
          onDateChange={handleDateCaughtChange}
        />
      </div>

      {/* BACKGROUND PICKER MODAL ----------------------------------- */}
      {showBackgrounds && (
        <div
          className="background-overlay"
          onClick={() => setShowBackgrounds(false)}
        >
          <div
            className="background-overlay-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-button"
              onClick={() => setShowBackgrounds(false)}
            >
              Close
            </button>
            <BackgroundLocationCard
              pokemon={pokemon}
              onSelectBackground={handleBackgroundSelect}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeInstance;