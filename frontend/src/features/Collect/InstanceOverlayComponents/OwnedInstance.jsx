// OwnedInstance.jsx

import React, { useState, useEffect, useContext } from 'react';
import './OwnedInstance.css';
import { PokemonDataContext } from '../../../contexts/PokemonDataContext';
import { useModal } from '../../../contexts/ModalContext'; // Import useModal

import EditSaveComponent from './EditSaveComponent';
import CPComponent from './OwnedComponents/CPComponent';
import FavoriteComponent from './OwnedComponents/FavoriteComponent';
import NameComponent from './OwnedComponents/NameComponent';
import LuckyComponent from './OwnedComponents/LuckyComponent';
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
import LevelComponent from './OwnedComponents/LevelComponent'; // Import LevelComponent

import { determineImageUrl } from '../../../utils/imageHelpers';
import useValidation from './hooks/useValidation';

const OwnedInstance = ({ pokemon, isEditable }) => {
  console.log('Pokemon Prop:', pokemon);
  const { updateDetails } = useContext(PokemonDataContext);

  // Use the custom validation hook
  const { errors: validationErrors, validate, resetErrors, computedValues } = useValidation(); // Updated to handle computed values

  // Use the modal context
  const { alert } = useModal();

  // Manage mega data via a single state object
  const [megaData, setMegaData] = useState({
    isMega: pokemon.ownershipStatus.is_mega || false,
    mega: pokemon.ownershipStatus.mega || false,
    megaForm: (pokemon.ownershipStatus.mega && pokemon.megaEvolutions?.length > 0)
      ? (pokemon.ownershipStatus.mega_form || pokemon.megaEvolutions[0].form)
      : null,
  });

  const [isFemale, setIsFemale] = useState(pokemon.ownershipStatus.gender === 'Female');
  const [isLucky, setIsLucky] = useState(pokemon.ownershipStatus.lucky);
  const [currentImage, setCurrentImage] = useState(determineImageUrl(isFemale, pokemon, megaData.isMega, megaData.megaForm));

  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState(pokemon.ownershipStatus.nickname);
  const [cp, setCP] = useState(Number(pokemon.ownershipStatus.cp)); // Ensure cp is a number
  const [isFavorite, setIsFavorite] = useState(pokemon.ownershipStatus.favorite);
  const [gender, setGender] = useState(pokemon.ownershipStatus.gender);
  const [weight, setWeight] = useState(Number(pokemon.ownershipStatus.weight)); // Ensure weight is a number
  const [height, setHeight] = useState(Number(pokemon.ownershipStatus.height)); // Ensure height is a number
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

  // Initialize level state
  const [level, setLevel] = useState(pokemon.ownershipStatus.level || null);

  // Removed useEffect that might overwrite 'level' state

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
    const updatedImage = determineImageUrl(isFemale, pokemon, megaData.isMega, megaData.megaForm);
    setCurrentImage(updatedImage); 
  }, [isFemale, megaData.isMega, pokemon, megaData.megaForm]);

  const handleGenderChange = (newGender) => {
    setGender(newGender);
    setIsFemale(newGender === 'Female'); // Update the gender state and isFemale
  };

  const handleCPChange = (newCP) => {
    setCP(Number(newCP)); // Ensure cp is stored as a number
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
    setWeight(Number(newWeight)); // Ensure weight is stored as a number
  };

  const handleHeightChange = (newHeight) => {
    setHeight(Number(newHeight)); // Ensure height is stored as a number
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
    setLevel(newLevel !== '' ? Number(newLevel) : null); // Ensure level is a number or null
  };

  const toggleEditMode = async () => {
    if (editMode) {
      // Prepare the fields to validate
      const fieldsToValidate = {
        level,
        cp,
        ivs, // Include IVs in the validation
        weight, // Current Weight from state
        height, // Current Height from state
        // Add other fields as necessary
      };

      console.log('Validating Fields:', fieldsToValidate);

      // Validate the fields along with the entire pokemon object
      const { validationErrors, computedValues: newComputedValues } = validate(fieldsToValidate, pokemon);
      console.log('Validation Errors:', validationErrors);
      console.log('Computed Values:', newComputedValues);

      const isValid = Object.keys(validationErrors).length === 0;

      if (isValid) {
        try {
          // Update state based on computed values
          if (newComputedValues.level !== undefined) {
            setLevel(newComputedValues.level);
            console.log(`Computed Level: ${newComputedValues.level}`);
          }
          if (newComputedValues.cp !== undefined) {
            setCP(newComputedValues.cp);
            console.log(`Computed CP: ${newComputedValues.cp}`);
          }
          if (newComputedValues.ivs !== undefined) {
            setIvs(newComputedValues.ivs);
            console.log(`Computed IVs:`, newComputedValues.ivs);
          }

          // Proceed with updating details, including computed values
          await updateDetails(pokemon.pokemonKey, {
            nickname: nickname,
            lucky: isLucky,
            cp: newComputedValues.cp !== undefined ? newComputedValues.cp : cp,
            favorite: isFavorite,
            gender: gender,
            weight: weight,
            height: height,
            fast_move_id: moves.fastMove,
            charged_move1_id: moves.chargedMove1,
            charged_move2_id: moves.chargedMove2,
            attack_iv: newComputedValues.ivs !== undefined ? newComputedValues.ivs.Attack : ivs.Attack,
            defense_iv: newComputedValues.ivs !== undefined ? newComputedValues.ivs.Defense : ivs.Defense,
            stamina_iv: newComputedValues.ivs !== undefined ? newComputedValues.ivs.Stamina : ivs.Stamina,
            location_caught: locationCaught,
            date_caught: dateCaught,
            location_card: selectedBackground ? selectedBackground.background_id : null,
            mega: megaData.mega,
            is_mega: megaData.isMega,
            mega_form: megaData.isMega ? megaData.megaForm : null,
            level: newComputedValues.level !== undefined ? newComputedValues.level : level, // Include the found level as a number
          });
          // Optionally reset errors after successful validation
          resetErrors();
          console.log(`Details updated successfully.`);
        } catch (error) {
          // Handle any errors from updateDetails
          console.error('Error updating details:', error);
          alert('An error occurred while updating the Pokémon details. Please try again.');
          return;
        }
      } else {
        // Validation failed, show alert modal with errors
        const errorMessages = Object.values(validationErrors).join('\n');
        alert(errorMessages);
        console.log(`Validation failed with errors:`, validationErrors);
        return;
      }
    }
    // Toggle edit mode
    setEditMode(!editMode);
  };

  const handleBackgroundSelect = (background) => {
    setSelectedBackground(background);
    setShowBackgrounds(false);
  };

  const selectableBackgrounds = pokemon.backgrounds.filter((background) => {
    if (!background.costume_id) {
      return true;
    }
    const variantTypeId = pokemon.variantType.split('_')[1];
    return background.costume_id === parseInt(variantTypeId, 10);
  });

  return (
    <div className="owned-instance">
      <div className="top-row">
        {isEditable && (
          <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
        )}
        <CPComponent 
          pokemon={pokemon} 
          editMode={editMode} 
          onCPChange={handleCPChange}
          cp={cp}
          errors={validationErrors}
          computedCP={computedValues?.cp} // Corrected: Use computedValues from the hook
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
            <div className="background-image" style={{ backgroundImage: `url(${selectedBackground.image_url})` }}></div>
            <div className="brightness-overlay"></div>
          </div>
        )}
        <div className="pokemon-image-container">
          {isLucky && <img src={process.env.PUBLIC_URL + '/images/lucky.png'} alt="Lucky Backdrop" className="lucky-backdrop" />}
          <img src={currentImage} alt={pokemon.name} className="pokemon-image" />
        </div>
      </div>
      <div className="name-mega-container">
        <NameComponent 
          pokemon={pokemon} 
          editMode={editMode} 
          onNicknameChange={handleNicknameChange} 
        />
        {pokemon.megaEvolutions &&
          pokemon.megaEvolutions.length > 0 &&
          !pokemon.ownershipStatus.shadow && // Ensure shadow ownership is false
          !pokemon.name.toLowerCase().includes("clone") && ( // Ensure name does not include "clone"
            <MegaComponent
              megaData={megaData}
              setMegaData={setMegaData}
              editMode={editMode}
              megaEvolutions={pokemon.megaEvolutions}
            />
        )}
      </div>

      {/* Level Component in Edit Mode */}
      {isEditable && (
        <LevelComponent
          pokemon={pokemon}
          editMode={editMode}
          level={level}
          onLevelChange={handleLevelChange}
          errors={validationErrors}
        />
      )}

      {/* Displaying Level when not in edit mode */}
      {!isEditable && level !== null && (
        <div className="level-display">
          <strong>Level:</strong> {level}
        </div>
      )}

      <div className="gender-lucky-row">
        {pokemon.ownershipStatus.shadow || pokemon.ownershipStatus.is_for_trade || pokemon.rarity === "Mythic" ? (
          <div className="lucky-placeholder"></div>
        ) : (
          <LuckyComponent 
            pokemon={pokemon} 
            onToggleLucky={handleLuckyToggle} 
            isLucky={isLucky} 
            editMode={editMode} 
          />
        )}
        <GenderComponent 
          pokemon={pokemon} 
          editMode={editMode} 
          isFemale={isFemale} 
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
      <div className="moves-content">
        <MovesComponent 
          pokemon={pokemon} 
          editMode={editMode} 
          onMovesChange={handleMovesChange} 
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
    </div>
  );

};

export default OwnedInstance;
