// TradeInstance.jsx

// TradeInstance.jsx – fixed version

import React, { useEffect, useMemo, useState } from 'react';
import './TradeInstance.css';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';

import EditSaveComponent from '@/components/EditSaveComponent';
import CP from '@/components/pokemonComponents/CP';
import NameComponent from './components/Caught/NameComponent';
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
import MaxComponent from './components/Caught/MaxComponent';
import MaxMovesComponent from './components/Caught/MaxMovesComponent';

import { determineImageUrl } from '@/utils/imageHelpers';

// --- 1) Import our validation hook and modal
import useValidation from './hooks/useValidation';
import { useModal } from '@/contexts/ModalContext';

import { cpMultipliers } from '@/utils/constants';
import { calculateCP } from '@/utils/calculateCP';
import { getEntityKey } from './utils/getEntityKey';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

interface BackgroundOption {
  background_id: number;
  image_url: string;
  costume_id?: number;
  [key: string]: unknown;
}

type TradePokemon = PokemonVariant & {
  instanceData: PokemonInstance;
  backgrounds: BackgroundOption[];
  max: unknown[];
};

interface TradeInstanceProps {
  pokemon: TradePokemon;
  isEditable: boolean;
}

const TradeInstance: React.FC<TradeInstanceProps> = ({ pokemon, isEditable }) => {
  const updateDetails = useInstancesStore((s) => s.updateInstanceDetails);
  const { alert } = useModal(); // for showing validation errors
  const entityKey = getEntityKey(pokemon);

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
  const [isFemale, setIsFemale] = useState<boolean>(
    pokemon.instanceData.gender === 'Female'
  );
  const [currentImage, setCurrentImage] = useState<string>(
    determineImageUrl(isFemale, pokemon)
  );

  // Edit mode & core states
  const [editMode, setEditMode] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string | null>(
    pokemon.instanceData.nickname
  );

  // We’ll store CP as a string so that editing is simpler. Convert to number on save.
  const [cp, setCP] = useState<string>(
    pokemon.instanceData.cp != null ? pokemon.instanceData.cp.toString() : ''
  );

  const [gender, setGender] = useState<string | null>(pokemon.instanceData.gender);
  const [weight, setWeight] = useState<number | ''>(
    Number(pokemon.instanceData.weight) || ''
  );
  const [height, setHeight] = useState<number | ''>(
    Number(pokemon.instanceData.height) || ''
  );

  const dynamax = !!pokemon.instanceData.dynamax;
  const gigantamax = !!pokemon.instanceData.gigantamax;
  const [showMaxOptions, setShowMaxOptions] = useState<boolean>(false);

  // Extract max moves from instanceData
  const [maxAttack, setMaxAttack] = useState<string>(
    pokemon.instanceData.max_attack != null
      ? String(pokemon.instanceData.max_attack)
      : ''
  );
  const [maxGuard, setMaxGuard] = useState<string>(
    pokemon.instanceData.max_guard != null
      ? String(pokemon.instanceData.max_guard)
      : ''
  );
  const [maxSpirit, setMaxSpirit] = useState<string>(
    pokemon.instanceData.max_spirit != null
      ? String(pokemon.instanceData.max_spirit)
      : ''
  );

  // Moves
  const [moves, setMoves] = useState<{
    fastMove: number | null;
    chargedMove1: number | null;
    chargedMove2: number | null;
  }>({
    fastMove: pokemon.instanceData.fast_move_id,
    chargedMove1: pokemon.instanceData.charged_move1_id,
    chargedMove2: pokemon.instanceData.charged_move2_id,
  });

  // IVs & Level ------------------------------------------------------
  const [ivs, setIvs] = useState<{
    Attack: number | '' | null;
    Defense: number | '' | null;
    Stamina: number | '' | null;
  }>({
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

  const [level, setLevel] = useState<number | null>(
    pokemon.instanceData.level != null ? Number(pokemon.instanceData.level) : null
  );

  // location / date --------------------------------------------------
  const [locationCaught, setLocationCaught] = useState<string | null>(
    pokemon.instanceData.location_caught
  );
  const [dateCaught, setDateCaught] = useState<string | null>(
    pokemon.instanceData.date_caught
  );

  // Background-related ----------------------------------------------
  const [showBackgrounds, setShowBackgrounds] = useState<boolean>(false);
  const [selectedBackground, setSelectedBackground] = useState<BackgroundOption | null>(
    null
  );

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
        (bg: BackgroundOption) => bg.background_id === locationCardId
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
      atk !== null &&
      def !== '' &&
      def !== null &&
      sta !== '' &&
      sta !== null &&
      !isNaN(atk) &&
      !isNaN(def) &&
      !isNaN(sta)
    ) {
      const multiplier = (cpMultipliers as Record<string, number>)[String(level)];
      if (multiplier) {
        const atkValue = Number(atk);
        const defValue = Number(def);
        const staValue = Number(sta);
        const calculatedCP = calculateCP(
          attack,
          defense,
          stamina,
          atkValue,
          defValue,
          staValue,
          multiplier
        );
        setCP(calculatedCP.toString());
      }
    }
  }, [currentBaseStats, level, ivs]);

  /* ------------------------------------------------------------------
   * HANDLERS ---------------------------------------------------------
   * ----------------------------------------------------------------*/
  const handleGenderChange = (newGender: string | null) => {
    setGender(newGender);
    setIsFemale(newGender === 'Female');
  };
  const handleCPChange = (newCP: string) => setCP(newCP);
  const handleNicknameChange = (newNickname: string | null) => setNickname(newNickname);
  const handleWeightChange = (newWeight: string) => {
    setWeight(newWeight === '' ? '' : Number(newWeight));
  };
  const handleHeightChange = (newHeight: string) => {
    setHeight(newHeight === '' ? '' : Number(newHeight));
  };
  const handleMovesChange = (newMoves: { fastMove: number | null; chargedMove1: number | null; chargedMove2: number | null }) => setMoves(newMoves);
  const handleIvChange = (newIvs: {
    Attack: number | '' | null;
    Defense: number | '' | null;
    Stamina: number | '' | null;
  }) => setIvs(newIvs);
  const handleLevelChange = (newLevel: string) => {
    setLevel(newLevel !== '' ? Number(newLevel) : null);
  };
  const handleLocationCaughtChange = (newLocation: string) => setLocationCaught(newLocation);
  const handleDateCaughtChange = (newDate: string) => setDateCaught(newDate);
  const handleBackgroundSelect = (background: BackgroundOption | null) => {
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
      const validationIvs = {
        Attack:
          ivs.Attack === '' || ivs.Attack === null ? undefined : Number(ivs.Attack),
        Defense:
          ivs.Defense === '' || ivs.Defense === null ? undefined : Number(ivs.Defense),
        Stamina:
          ivs.Stamina === '' || ivs.Stamina === null ? undefined : Number(ivs.Stamina),
      };
      const fieldsToValidate = {
        level: level ?? undefined,
        cp: cp !== '' ? Number(cp) : undefined,
        ivs: validationIvs,
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
        weight: weight === '' || Number.isNaN(Number(weight)) ? null : Number(weight),
        height: height === '' || Number.isNaN(Number(height)) ? null : Number(height),
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
        max_attack: maxAttack === '' ? null : Number(maxAttack),
        max_guard: maxGuard === '' ? null : Number(maxGuard),
        max_spirit: maxSpirit === '' ? null : Number(maxSpirit),
      };

      try {
        await updateDetails({ [entityKey]: payload as Partial<PokemonInstance> });
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
            onClick={editMode ? () => setShowBackgrounds(!showBackgrounds) : undefined}
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
          pokemon={pokemon as any}
          editMode={editMode}
          onNicknameChange={handleNicknameChange}
        />
      </div>

      {/* LEVEL + GENDER -------------------------------------------- */}
      <div className="level-gender-container">
        <Level
          editMode={editMode}
          level={level}
          onLevelChange={handleLevelChange}
        />
        {(editMode || (gender !== null && gender !== '')) && (
          <div className="gender-wrapper">
            <Gender
              pokemon={pokemon as any}
              editMode={editMode}
              onGenderChange={handleGenderChange}
            />
          </div>
        )}
      </div>

      {/* STATS ------------------------------------------------------ */}
      <div className="stats-container">
        <Weight
          pokemon={pokemon as any}
          editMode={editMode}
          onWeightChange={handleWeightChange}
        />
        <Types pokemon={pokemon} />
        <Height
          pokemon={pokemon as any}
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
          isShadow={!!pokemon.instanceData.shadow}
          isPurified={!!pokemon.instanceData.purified}
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
