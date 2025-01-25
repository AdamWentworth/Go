// TradeInstance.jsx

import React, { useState, useContext, useEffect, useMemo } from 'react';
import './TradeInstance.css';
import { PokemonDataContext } from '../../../contexts/PokemonDataContext'; 

import EditSaveComponent from './EditSaveComponent';
import CPComponent from './OwnedComponents/CPComponent';
import NameComponent from './OwnedComponents/NameComponent';
import GenderComponent from './OwnedComponents/GenderComponent';
import WeightComponent from './OwnedComponents/WeightComponent';
import TypeComponent from './OwnedComponents/TypeComponent';
import HeightComponent from './OwnedComponents/HeightComponent';
import MovesComponent from './OwnedComponents/MovesComponent';
import LocationCaughtComponent from './OwnedComponents/LocationCaughtComponent';
import DateCaughtComponent from './OwnedComponents/DateCaughtComponent';
import BackgroundComponent from './OwnedComponents/BackgroundComponent';
import LevelComponent from './OwnedComponents/LevelComponent';
import IVComponent from './OwnedComponents/IVComponent';
import MaxComponent from './OwnedComponents/MaxComponent';

import { determineImageUrl } from '../../../utils/imageHelpers';

// --- 1) Import our validation hook and modal
import useValidation from './hooks/useValidation';
import { useModal } from '../../../contexts/ModalContext';

import { cpMultipliers } from '../../../utils/constants'; // If needed for CP calculations
import { calculateCP } from '../../../utils/calculateCP'; // If needed for CP recalculation

const TradeInstance = ({ pokemon, isEditable }) => {
  const { updateDetails } = useContext(PokemonDataContext);
  const { alert } = useModal(); // for showing validation errors

  // --- 2) Extract validation objects from our hook
  const { errors: validationErrors, validate, resetErrors, computedValues } = useValidation();

  // Gender / Image
  const [isFemale, setIsFemale] = useState(pokemon.ownershipStatus.gender === 'Female');
  const [currentImage, setCurrentImage] = useState(determineImageUrl(isFemale, pokemon));

  // Edit mode & core states
  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState(pokemon.ownershipStatus.nickname);

  // We’ll store CP as a string so that editing is simpler. Convert to number on save.
  const [cp, setCP] = useState(
    pokemon.ownershipStatus.cp != null ? pokemon.ownershipStatus.cp.toString() : ''
  );

  const [gender, setGender] = useState(pokemon.ownershipStatus.gender);
  const [weight, setWeight] = useState(Number(pokemon.ownershipStatus.weight));
  const [height, setHeight] = useState(Number(pokemon.ownershipStatus.height));

  const [dynamax, setDynamax] = useState(!!pokemon.ownershipStatus.dynamax);
  const [gigantamax, setGigantamax] = useState(!!pokemon.ownershipStatus.gigantamax);

  // Moves
  const [moves, setMoves] = useState({
    fastMove: pokemon.ownershipStatus.fast_move_id,
    chargedMove1: pokemon.ownershipStatus.charged_move1_id,
    chargedMove2: pokemon.ownershipStatus.charged_move2_id,
  });

  // If you want the same “two-out-of-three” approach for CP/IV/Level, 
  // we should track IVs & Level the same as OwnedInstance:
  const [ivs, setIvs] = useState({
    Attack: pokemon.ownershipStatus.attack_iv != null
      ? Number(pokemon.ownershipStatus.attack_iv)
      : '',
    Defense: pokemon.ownershipStatus.defense_iv != null
      ? Number(pokemon.ownershipStatus.defense_iv)
      : '',
    Stamina: pokemon.ownershipStatus.stamina_iv != null
      ? Number(pokemon.ownershipStatus.stamina_iv)
      : '',
  });

  const [level, setLevel] = useState(
    pokemon.ownershipStatus.level != null ? Number(pokemon.ownershipStatus.level) : null
  );

  const [locationCaught, setLocationCaught] = useState(pokemon.ownershipStatus.location_caught);
  const [dateCaught, setDateCaught] = useState(pokemon.ownershipStatus.date_caught);

  // Background-related
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(null);

  // --- 3) Compute base stats (if relevant). 
  // If you're not supporting Mega forms in trades, you can do a simpler approach:
  const currentBaseStats = useMemo(() => {
    return {
      attack: Number(pokemon.attack),
      defense: Number(pokemon.defense),
      stamina: Number(pokemon.stamina),
    };
  }, [pokemon]);

  // On mount, set background if relevant
  useEffect(() => {
    if (pokemon.ownershipStatus.location_card !== null) {
      const locationCardId = parseInt(pokemon.ownershipStatus.location_card, 10);
      const background = pokemon.backgrounds.find(
        (bg) => bg.background_id === locationCardId
      );
      if (background) {
        setSelectedBackground(background);
      }
    }
  }, [pokemon.backgrounds, pokemon.ownershipStatus.location_card]);

  // Recalculate the displayed image on changes
  useEffect(() => {
    setCurrentImage(determineImageUrl(
      isFemale,
      pokemon,
      false,
      undefined,
      false,
      undefined,
      false,
      gigantamax
    ));
  }, [isFemale, pokemon, gigantamax]);

  // (Optional) Recalculate CP whenever baseStats, level, or ivs change 
  // if you want the same auto-update logic in TradeInstance.
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

  // Handlers
  const handleMaxClick = () => {
    const maxEntry = pokemon.max?.[0];
    if (!maxEntry) return;

    const hasDynamax = maxEntry.dynamax === 1;
    const hasGigantamax = maxEntry.gigantamax === 1;

    if (!dynamax && !gigantamax) {
        // Start with Dynamax if available, otherwise start with Gigantamax
        if (hasDynamax) {
            setDynamax(true);
        } else if (hasGigantamax) {
            setGigantamax(true);
        }
    } else if (dynamax) {
        // If currently Dynamax, switch to Gigantamax if available, else reset
        if (hasGigantamax) {
            setDynamax(false);
            setGigantamax(true);
        } else {
            setDynamax(false);
        }
    } else if (gigantamax) {
        // If currently Gigantamax, reset to null
        setGigantamax(false);
    }
  };

  const handleGenderChange = (newGender) => {
    setGender(newGender);
    setIsFemale(newGender === 'Female');
  };

  const handleCPChange = (newCP) => {
    setCP(newCP);
  };

  const handleNicknameChange = (newNickname) => {
    setNickname(newNickname);
  };

  const handleWeightChange = (newWeight) => {
    setWeight(Number(newWeight));
  };

  const handleHeightChange = (newHeight) => {
    setHeight(Number(newHeight));
  };

  const handleMovesChange = (newMoves) => {
    setMoves(newMoves);
  };

  // Mirror OwnedInstance’s IV & Level handlers if you want them editable in Trade
  const handleIvChange = (newIvs) => {
    setIvs(newIvs);
  };

  const handleLevelChange = (newLevel) => {
    setLevel(newLevel !== '' ? Number(newLevel) : null);
  };

  const handleLocationCaughtChange = (newLocation) => {
    setLocationCaught(newLocation);
  };

  const handleDateCaughtChange = (newDate) => {
    setDateCaught(newDate);
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

  // --- 4) Validate in toggleEditMode just like OwnedInstance
  const toggleEditMode = async () => {
    if (editMode) {
      // Prepare the same fields we validated in OwnedInstance
      const fieldsToValidate = {
        level,
        cp: cp !== '' ? Number(cp) : null, 
        ivs,
        weight,
        height,
      };

      // Validate these fields against currentBaseStats
      const { validationErrors, computedValues: newComputedValues } = validate(
        fieldsToValidate,
        currentBaseStats
      );

      const isValid = Object.keys(validationErrors).length === 0;
      if (!isValid) {
        // Show errors via the alert modal
        const errorMessages = Object.values(validationErrors).join('\n');
        alert(errorMessages);
        return; // Stop save on validation failure
      } else {
        // If everything looks good, we can optionally reset errors
        resetErrors();
      }

      // If some fields were computed, update local state
      if (newComputedValues.level !== undefined) {
        setLevel(newComputedValues.level);
      }
      if (newComputedValues.cp !== undefined) {
        setCP(newComputedValues.cp.toString());
      }
      if (newComputedValues.ivs !== undefined) {
        setIvs(newComputedValues.ivs);
      }

      // Proceed with updating details
      try {
        await updateDetails(pokemon.pokemonKey, {
          nickname: nickname,
          // cp was validated, so safe to parse
          cp: cp !== '' ? Number(cp) : null,
          gender: gender,
          weight: weight,
          height: height,
          fast_move_id: moves.fastMove,
          charged_move1_id: moves.chargedMove1,
          charged_move2_id: moves.chargedMove2,
          // If you want to store level & IVs for trades:
          level:
            newComputedValues.level !== undefined
              ? newComputedValues.level
              : level,
          attack_iv:
            newComputedValues.ivs?.Attack ?? (ivs.Attack === '' ? null : ivs.Attack),
          defense_iv:
            newComputedValues.ivs?.Defense ?? (ivs.Defense === '' ? null : ivs.Defense),
          stamina_iv:
            newComputedValues.ivs?.Stamina ?? (ivs.Stamina === '' ? null : ivs.Stamina),
          location_caught: locationCaught,
          date_caught: dateCaught,
          location_card: selectedBackground ? selectedBackground.background_id : null,
          dynamax: dynamax,
          gigantamax: gigantamax
        });
      } catch (error) {
        console.error('Error updating trade details:', error);
        alert('An error occurred while updating the Pokémon details. Please try again.');
        return;
      }
    }

    // Finally toggle edit mode
    setEditMode(!editMode);
  };

  return (
    <div className="trade-instance">
      <div className="trade-title"></div>
      <div className="top-row">
        <div className="edit-save-container">
            <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} isEditable={isEditable} />
        </div>
        <h2>Trade</h2>
      </div>

      {/* CP Component with validation errors passed down */}
      <div className="CPComponent">
        <CPComponent
          pokemon={pokemon}
          editMode={editMode}
          onCPChange={handleCPChange}
          cp={cp}
          errors={validationErrors} // pass the CP errors if any
        />
      </div>

      {selectableBackgrounds.length > 0 && (
        <div className={`background-select-row ${editMode ? 'active' : ''}`}>
          <img
            src={process.env.PUBLIC_URL + '/images/location.png'}
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
            ></div>
            <div className="brightness-overlay"></div>
          </div>
        )}
        <div className="pokemon-image-container">
          <img src={currentImage} alt={pokemon.name} className="pokemon-image" />
          {dynamax && (
            <img 
              src={process.env.PUBLIC_URL + '/images/dynamax.png'} 
              alt="Dynamax Badge" 
              className="max-badge" 
            />
          )}
          {gigantamax && (
            <img 
              src={process.env.PUBLIC_URL + '/images/gigantamax.png'} 
              alt="Gigantamax Badge" 
              className="max-badge" 
            />
          )}
        </div>
      </div>

      <div className="name-container">
        <NameComponent
          pokemon={pokemon}
          editMode={editMode}
          onNicknameChange={handleNicknameChange}
        />
      </div>

      <div className="level-gender-container">
      <LevelComponent
          pokemon={pokemon}
          editMode={editMode}
          level={level}
          onLevelChange={handleLevelChange}
          errors={validationErrors}
        />
        <GenderComponent
          pokemon={pokemon}
          editMode={editMode}
          onGenderChange={handleGenderChange}
        />
      </div>

      <div className="stats-container">
        <WeightComponent
          pokemon={pokemon}
          editMode={editMode}
          onWeightChange={handleWeightChange}
        />
        <TypeComponent pokemon={pokemon} />
        <HeightComponent
          pokemon={pokemon}
          editMode={editMode}
          onHeightChange={handleHeightChange}
        />
      </div>

      <MaxComponent 
        pokemon={pokemon} 
        editMode={editMode}
        dynamax={dynamax}
        gigantamax={gigantamax}
        onMaxClick={handleMaxClick}
      />

      <div className="moves-container">
        <MovesComponent
          pokemon={pokemon}
          editMode={editMode}
          onMovesChange={handleMovesChange}
        />
      </div>
      {(editMode || (ivs.Attack !== '' && ivs.Defense !== '' && ivs.Stamina !== '')) && (
        <div className="iv-component">
          <IVComponent 
            pokemon={pokemon} 
            editMode={editMode} 
            onIvChange={handleIvChange} 
            ivs={ivs}
            errors={validationErrors}
          />
        </div>
      )}
      <div className="location-container">
        <LocationCaughtComponent
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

      {showBackgrounds && (
        <div className="background-overlay" onClick={() => setShowBackgrounds(false)}>
          <div className="background-overlay-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowBackgrounds(false)}>
              Close
            </button>
            <BackgroundComponent pokemon={pokemon} onSelectBackground={handleBackgroundSelect} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeInstance;
