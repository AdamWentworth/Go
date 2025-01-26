// OwnedInstance.jsx

import React, { useState, useEffect, useContext, useMemo } from 'react';
import './OwnedInstance.css';

// Contexts and Hooks
import { PokemonDataContext } from '../../../contexts/PokemonDataContext';
import { useModal } from '../../../contexts/ModalContext'; 
import useValidation from './hooks/useValidation';

// Components
import EditSaveComponent from './EditSaveComponent';
import CPComponent from './OwnedComponents/CPComponent';
import FavoriteComponent from './OwnedComponents/FavoriteComponent';
import NameComponent from './OwnedComponents/NameComponent';
import LuckyComponent from './OwnedComponents/LuckyComponent';
import PurifyComponent from './OwnedComponents/PurifyComponent';
import GenderComponent from './OwnedComponents/GenderComponent';
import WeightComponent from './OwnedComponents/WeightComponent';
import TypeComponent from './OwnedComponents/TypeComponent';
import HeightComponent from './OwnedComponents/HeightComponent';
import MovesComponent from './OwnedComponents/MovesComponent';
import IVComponent from './OwnedComponents/IVComponent';
import LocationCaughtComponent from './OwnedComponents/LocationCaughtComponent';
import DateCaughtComponent from './OwnedComponents/DateCaughtComponent';
import BackgroundComponent from './OwnedComponents/BackgroundComponent';
import MegaComponent from './OwnedComponents/MegaComponent';
import LevelComponent from './OwnedComponents/LevelComponent'; 
import FusionComponent from './OwnedComponents/FusionComponent';
import FuseOverlay from './OwnedComponents/FuseOverlay';
import MaxComponent from './OwnedComponents/MaxComponent';
import MaxMovesComponent from "./OwnedComponents/MaxMovesComponent";

// Utilities and Constants
import { determineImageUrl } from '../../../utils/imageHelpers';
import { calculateBaseStats } from '../../../utils/calculateBaseStats';

// Hooks
import { useFusion } from './hooks/useFusion'; 
import { useCalculatedCP } from './hooks/useCalculatedCP';

const OwnedInstance = ({ pokemon, isEditable }) => {
  // Contexts and custom hooks
  const { updateDetails } = useContext(PokemonDataContext);
  const { alert } = useModal();
  const { errors: validationErrors, validate, resetErrors } = useValidation();

  // State declarations
  const [megaData, setMegaData] = useState({
    isMega: pokemon.ownershipStatus.is_mega || false,
    mega: pokemon.ownershipStatus.mega || false,
    megaForm: (pokemon.ownershipStatus.mega && pokemon.megaEvolutions?.length > 0)
      ? (pokemon.ownershipStatus.mega_form || pokemon.megaEvolutions[0].form)
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

  const [isFemale, setIsFemale] = useState(pokemon.ownershipStatus.gender === 'Female');
  const [isLucky, setIsLucky] = useState(pokemon.ownershipStatus.lucky);
  const [currentImage, setCurrentImage] = useState(determineImageUrl(isFemale, pokemon, megaData.isMega, megaData.megaForm));
  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState(pokemon.ownershipStatus.nickname);
  const [cp, setCP] = useState(pokemon.ownershipStatus.cp ? pokemon.ownershipStatus.cp.toString() : '');
  const [isFavorite, setIsFavorite] = useState(pokemon.ownershipStatus.favorite);
  const [gender, setGender] = useState(pokemon.ownershipStatus.gender);
  const [weight, setWeight] = useState(Number(pokemon.ownershipStatus.weight));
  const [height, setHeight] = useState(Number(pokemon.ownershipStatus.height));
  const [moves, setMoves] = useState({
    fastMove: pokemon.ownershipStatus.fast_move_id,
    chargedMove1: pokemon.ownershipStatus.charged_move1_id,
    chargedMove2: pokemon.ownershipStatus.charged_move2_id,
  });
  const [ivs, setIvs] = useState({
    Attack: pokemon.ownershipStatus.attack_iv != null ? Number(pokemon.ownershipStatus.attack_iv) : '',
    Defense: pokemon.ownershipStatus.defense_iv != null ? Number(pokemon.ownershipStatus.defense_iv) : '',
    Stamina: pokemon.ownershipStatus.stamina_iv != null ? Number(pokemon.ownershipStatus.stamina_iv) : '',
  });
  const [locationCaught, setLocationCaught] = useState(pokemon.ownershipStatus.location_caught);
  const [dateCaught, setDateCaught] = useState(pokemon.ownershipStatus.date_caught);
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [level, setLevel] = useState(pokemon.ownershipStatus.level || null);
  const [isShadow, setIsShadow] = useState(!!pokemon.ownershipStatus.shadow);
  const [isPurified, setIsPurified] = useState(!!pokemon.ownershipStatus.purified);

  // Extract max moves from ownershipStatus
  const [maxAttack, setMaxAttack] = useState(pokemon.ownershipStatus.max_attack || '');
  const [maxGuard, setMaxGuard] = useState(pokemon.ownershipStatus.max_guard || '');
  const [maxSpirit, setMaxSpirit] = useState(pokemon.ownershipStatus.max_spirit || '');

  // State for toggling max options
  const [showMaxOptions, setShowMaxOptions] = useState(false);

  // Determine if Dynamax or Gigantamax is active
  const dynamax = !!pokemon.ownershipStatus.dynamax;
  const gigantamax = !!pokemon.ownershipStatus.gigantamax;

  // Memoized values
  const currentBaseStats = useMemo(
    () => calculateBaseStats(pokemon, megaData, fusion),
    [pokemon, megaData, fusion]
  );

  console.log(pokemon)

  useCalculatedCP({ currentBaseStats, level, ivs, setCP });

  useEffect(() => {
    if (pokemon.ownershipStatus.location_card !== null) {
      const locationCardId = parseInt(pokemon.ownershipStatus.location_card, 10);
      const background = pokemon.backgrounds.find(bg => bg.background_id === locationCardId);
      if (background) {
        setSelectedBackground(background);
      }
    }
  }, [pokemon.backgrounds, pokemon.ownershipStatus.location_card]);

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

  // Handler Functions
  const handleGenderChange = (newGender) => {
    setGender(newGender);
    setIsFemale(newGender === 'Female');
  };

  const handleCPChange = (newCP) => {
    setCP(newCP);
  };

  const handleLuckyToggle = (newLuckyStatus) => {
    setIsLucky(newLuckyStatus);
  };

  const handleNicknameChange = (newNickname) => {
    setNickname(newNickname);
  };

  const handleFavoriteChange = (newFavoriteStatus) => {
    setIsFavorite(newFavoriteStatus);
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

  const handleIvChange = (newIvs) => {
    setIvs(newIvs);
  };

  const handleLocationCaughtChange = (newLocation) => {
    setLocationCaught(newLocation);
  };

  const handleDateCaughtChange = (newDate) => {
    setDateCaught(newDate);
  };

  const handleLevelChange = (newLevel) => {
    setLevel(newLevel !== '' ? Number(newLevel) : null);
  };

  const handlePurifyToggle = (newPurifiedValue) => {
    if (newPurifiedValue) {
      setIsPurified(true);
      setIsShadow(false);
    } else {
      setIsPurified(false);
      setIsShadow(true);
    }
  };

  // Handlers for MaxComponent edits
  const handleMaxAttackChange = (newMaxAttack) => {
    setMaxAttack(newMaxAttack);
  };

  const handleMaxGuardChange = (newMaxGuard) => {
    setMaxGuard(newMaxGuard);
  };

  const handleMaxSpiritChange = (newMaxSpirit) => {
    setMaxSpirit(newMaxSpirit);
  };

  // Handler for toggling max options
  const handleToggleMaxOptions = () => {
    setShowMaxOptions(prev => !prev);
  };

  useEffect(() => {
    if (!editMode) {
        setShowMaxOptions(false); // Close max options when edit mode is disabled
    }
  }, [editMode]);

  useEffect(() => {
    if (editMode) {
      // We just ENTERED edit mode, store the current partner
      setOriginalFusedWith(fusion.fusedWith);
    }
  }, [editMode]);

  const toggleEditMode = async () => {
    if (editMode) {
      const fieldsToValidate = {
        level,
        cp: cp !== '' ? Number(cp) : null,
        ivs,
        weight,
        height,
      };
  
      const { validationErrors, computedValues: newComputedValues } = validate(
        fieldsToValidate,
        currentBaseStats
      );
      const isValid = Object.keys(validationErrors).length === 0;
  
      if (isValid) {
        try {
          // Apply computed values to local state if needed
          if (newComputedValues.level !== undefined) {
            setLevel(newComputedValues.level);
          }
          if (newComputedValues.cp !== undefined) {
            setCP(newComputedValues.cp.toString());
          }
          if (newComputedValues.ivs !== undefined) {
            setIvs(newComputedValues.ivs);
          }

          // Prepare changes object
          const changes = {};

          // Primary Pokémon changes
          changes[pokemon.pokemonKey] = {
            nickname: nickname,
            lucky: isLucky,
            cp:
              newComputedValues.cp !== undefined
                ? newComputedValues.cp ?? null
                : cp !== '' ? Number(cp) : null,
            favorite: isFavorite,
            gender: gender,
            weight: weight,
            height: height,
            fast_move_id: moves.fastMove,
            charged_move1_id: moves.chargedMove1,
            charged_move2_id: moves.chargedMove2,
            attack_iv:
              newComputedValues.ivs !== undefined
                ? newComputedValues.ivs.Attack === ''
                  ? null
                  : newComputedValues.ivs.Attack
                : ivs.Attack === ''
                ? null
                : ivs.Attack,
            defense_iv:
              newComputedValues.ivs !== undefined
                ? newComputedValues.ivs.Defense === ''
                  ? null
                  : newComputedValues.ivs.Defense
                : ivs.Defense === ''
                ? null
                : ivs.Defense,
            stamina_iv:
              newComputedValues.ivs !== undefined
                ? newComputedValues.ivs.Stamina === ''
                  ? null
                  : newComputedValues.ivs.Stamina
                : ivs.Stamina === ''
                ? null
                : ivs.Stamina,
            location_caught: locationCaught,
            date_caught: dateCaught,
            location_card: selectedBackground ? selectedBackground.background_id : null,
            mega: megaData.mega,
            is_mega: megaData.isMega,
            mega_form: megaData.isMega ? megaData.megaForm : null,
            level:
              newComputedValues.level !== undefined
                ? newComputedValues.level
                : level,
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

          // Handle fusion changes
          const { is_fused, fusion_form, fusedWith: newFusedWith } = fusion;

          // (A) If we parted ways with the old partner => disable false, fused_with: null
          if (originalFusedWith && originalFusedWith !== newFusedWith) {
            changes[originalFusedWith] = {
              disabled: false,
              fused_with: null,
              is_fused: false,
              fusion_form: null,
            };
          }

          // (B) If newly fused with a different partner => disable true, fused_with: current key
          if (newFusedWith && is_fused && newFusedWith !== originalFusedWith) {
            changes[newFusedWith] = {
              disabled: true,
              fused_with: pokemon.pokemonKey,
              is_fused: true,
              fusion_form: fusion_form,  
            };
          }

          // Now call updateDetails ONCE, passing the entire changes object
          await updateDetails(changes);

          resetErrors();  
        } catch (error) {
          console.error('Error updating details:', error);
          alert('An error occurred while updating the Pokémon details. Please try again.');
          return;
        }
      } else {
        const errorMessages = Object.values(validationErrors).join('\n');
        alert(errorMessages);
        console.log('Validation failed with errors:', validationErrors);
        return;
      }
    }
    setEditMode(!editMode);
  };

  const handleBackgroundSelect = (background) => {
    setSelectedBackground(background);
    setShowBackgrounds(false);
  };

  // Computed variables
  const selectableBackgrounds = pokemon.backgrounds.filter((background) => {
    if (!background.costume_id) {
      return true;
    }
    const variantTypeId = pokemon.variantType.split('_')[1];
    return background.costume_id === parseInt(variantTypeId, 10);
  });

  // JSX Return
  return (
    <div className="owned-instance">
      <div className="top-row">
        <EditSaveComponent 
          editMode={editMode} 
          toggleEditMode={toggleEditMode}
          isEditable={isEditable}
        />
        <CPComponent 
          pokemon={pokemon} 
          editMode={editMode} 
          onCPChange={handleCPChange}
          cp={cp}
          errors={validationErrors}
        />
        <FavoriteComponent 
          pokemon={pokemon} 
          editMode={editMode} 
          onFavoriteChange={handleFavoriteChange} 
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
              style={{ backgroundImage: `url(${selectedBackground.image_url})` }}>
            </div>
            <div className="brightness-overlay"></div>
          </div>
        )}
        <div className="pokemon-image-container">
          {isLucky && (
            <img 
              src={process.env.PUBLIC_URL + '/images/lucky.png'} 
              alt="Lucky Backdrop" 
              className="lucky-backdrop" 
            />
          )}
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
          {isPurified && (
            <img 
              src={process.env.PUBLIC_URL + '/images/purified.png'} 
              alt="Purified Badge" 
              className="purified-badge" 
            />
          )}
        </div>
      </div>
      <div className="purify-name-shadow-container">
        <LuckyComponent 
          pokemon={pokemon} 
          onToggleLucky={handleLuckyToggle} 
          isLucky={isLucky} 
          editMode={editMode} 
          isShadow={isShadow}
        />
        <NameComponent 
          pokemon={pokemon} 
          editMode={editMode} 
          onNicknameChange={handleNicknameChange} 
        />
        <PurifyComponent 
          isShadow={isShadow}
          isPurified={isPurified}
          editMode={editMode}
          onTogglePurify={handlePurifyToggle}
        />
      </div>
      <div className="level-gender-row">
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
          isFemale={isFemale} 
          onGenderChange={handleGenderChange}
          />
      </div>
      <div className="weight-type-height-container">
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
        <MovesComponent 
          pokemon={pokemon} 
          editMode={editMode} 
          onMovesChange={handleMovesChange}
          isShadow={isShadow}
          isPurified={isPurified}
        />
      </div>
      <div className="iv-component">
        <IVComponent 
          pokemon={pokemon} 
          editMode={editMode} 
          onIvChange={handleIvChange} 
          ivs={ivs}
          errors={validationErrors}
        />
      </div>
      <div className="location-caught-component">
        <LocationCaughtComponent 
          pokemon={pokemon} 
          editMode={editMode} 
          onLocationChange={handleLocationCaughtChange} 
        />
      </div>
      <div className="date-caught-component">
        <DateCaughtComponent 
          pokemon={pokemon} 
          editMode={editMode} 
          onDateChange={handleDateCaughtChange} 
        />
      </div>


      {showBackgrounds && (
        <div className="background-overlay" onClick={() => setShowBackgrounds(false)}>
          <div className="background-overlay-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowBackgrounds(false)}>Close</button>
            <BackgroundComponent pokemon={pokemon} onSelectBackground={handleBackgroundSelect} />
          </div>
        </div>
      )}
      {fusion.overlayPokemon && (
        <FuseOverlay 
          pokemon={fusion.overlayPokemon} 
          onClose={() => 
            setFusion(prev => ({ 
              ...prev, 
              overlayPokemon: null 
            }))
          } 
          onFuse={handleFuseProceed}
        />
      )}
    </div>
  );
};

export default OwnedInstance;
