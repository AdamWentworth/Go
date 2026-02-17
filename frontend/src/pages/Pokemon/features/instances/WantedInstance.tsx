import React, { useEffect, useState } from 'react';
import './WantedInstance.css';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';

import EditSaveComponent from '@/components/EditSaveComponent';
import NameComponent from './components/Caught/NameComponent';
import Gender from '@/components/pokemonComponents/Gender';
import Weight from '@/components/pokemonComponents/Weight';
import Types from '@/components/pokemonComponents/Types';
import Height from '@/components/pokemonComponents/Height';
import Moves from '@/components/pokemonComponents/Moves';
import FriendshipManager from './components/Wanted/FriendshipManager';
import BackgroundLocationCard from '@/components/pokemonComponents/BackgroundLocationCard';

import { determineImageUrl } from '@/utils/imageHelpers';
import { getEntityKey } from './utils/getEntityKey';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { VariantBackground } from '@/types/pokemonSubTypes';

type BackgroundOption = VariantBackground;

type WantedPokemon = PokemonVariant & {
  instanceData: PokemonInstance;
  backgrounds: BackgroundOption[];
};

interface WantedInstanceProps {
  pokemon: WantedPokemon;
  isEditable: boolean;
}

const WantedInstance: React.FC<WantedInstanceProps> = ({ pokemon, isEditable }) => {
  const updateDetails = useInstancesStore((s) => s.updateInstanceDetails);
  const entityKey = getEntityKey(pokemon);

  const [editMode, setEditMode] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string | null>(pokemon.instanceData.nickname);
  const [isFavorite, setIsFavorite] = useState<boolean>(!!pokemon.instanceData.favorite);
  const [gender, setGender] = useState<string | null>(pokemon.instanceData.gender);
  const [isFemale, setIsFemale] = useState<boolean>(pokemon.instanceData.gender === 'Female');
  const [currentImage, setCurrentImage] = useState<string>(determineImageUrl(isFemale, pokemon));  // Set the initial image based on gender
  const [weight, setWeight] = useState<number | null>(pokemon.instanceData.weight);
  const [height, setHeight] = useState<number | null>(pokemon.instanceData.height);
  const [moves, setMoves] = useState<{
    fastMove: number | null;
    chargedMove1: number | null;
    chargedMove2: number | null;
  }>({
    fastMove: pokemon.instanceData.fast_move_id,
    chargedMove1: pokemon.instanceData.charged_move1_id,
    chargedMove2: pokemon.instanceData.charged_move2_id,
  });
  const [friendship, setFriendship] = useState<number>(
    Number((pokemon.instanceData.friendship_level as number | undefined) ?? 0),
  );
  const [isLucky, setIsLucky] = useState<boolean>(!!pokemon.instanceData.pref_lucky);

  // Background-related state
  const [showBackgrounds, setShowBackgrounds] = useState<boolean>(false);
  const [selectedBackground, setSelectedBackground] = useState<BackgroundOption | null>(null);

  // State to hold Dynamax and Gigantamax
  const [dynamax] = useState<boolean>(!!pokemon.instanceData.dynamax);
  const [gigantamax] = useState<boolean>(!!pokemon.instanceData.gigantamax);

  // On mount, set background if relevant
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

  useEffect(() => {
    // Update the image when the gender or pokemon changes or max states change
    const updatedImage = determineImageUrl(
      isFemale,
      pokemon,
      false,
      undefined,
      false,
      undefined,
      false,
      gigantamax
    );
    setCurrentImage(updatedImage);
  }, [isFemale, pokemon, dynamax, gigantamax]);

  const handleNicknameChange = (newNickname: string | null) => setNickname(newNickname);
  const handleFavoriteChange = (newFavoriteStatus: boolean) => setIsFavorite(newFavoriteStatus);
  const handleGenderChange = (newGender: string | null) => {
    setGender(newGender);
    setIsFemale(newGender === 'Female');  // Update gender state and isFemale flag
  };
  const handleWeightChange = (newWeight: string) => setWeight(newWeight === '' ? null : Number(newWeight));
  const handleHeightChange = (newHeight: string) => setHeight(newHeight === '' ? null : Number(newHeight));
  const handleMovesChange = (newMoves: { fastMove: number | null; chargedMove1: number | null; chargedMove2: number | null }) => setMoves(newMoves);

  const handleBackgroundSelect = (background: BackgroundOption | null) => {
    setSelectedBackground(background);
    setShowBackgrounds(false);
  };

  const toggleEditMode = () => {
    if (editMode) {
      void updateDetails(entityKey, { 
        nickname, 
        favorite: isFavorite, 
        gender, 
        weight, 
        height,
        fast_move_id: moves.fastMove,
        charged_move1_id: moves.chargedMove1,
        charged_move2_id: moves.chargedMove2,
        friendship_level: friendship,
        pref_lucky: isLucky,
        location_card: selectedBackground ? String(selectedBackground.background_id) : null,
        dynamax: dynamax,
        gigantamax: gigantamax
      });
    }
    setEditMode(!editMode);
  };

  const selectableBackgrounds = pokemon.backgrounds.filter((background: BackgroundOption) => {
    if (!background.costume_id) {
      return true;
    }
    const variantTypeId = pokemon.variantType?.split('_')[1];
    return background.costume_id === parseInt(variantTypeId ?? '', 10);
  });

  return (
    <div className="wanted-instance">
      <div className="top-row">
        <div className="edit-save-container">
            <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} isEditable={isEditable} />
        </div>
        <h2>Wanted</h2>
      </div>

      {selectableBackgrounds.length > 0 && (
        <div className="background-select-container">
          <div className={`background-select-row ${editMode ? 'active' : ''}`}>
            <img
              src={'/images/location.png'}
              alt="Background Selector"
              className="background-icon"
              onClick={editMode ? () => setShowBackgrounds(!showBackgrounds) : undefined}
            />
          </div>
        </div>
      )}

      <FriendshipManager 
        friendship={friendship} 
        setFriendship={setFriendship} 
        editMode={editMode} 
        isLucky={isLucky}
        setIsLucky={setIsLucky}
      />

      <div className="image-container">
        {selectedBackground && (
          <div className="background-container">
            <div className="background-image" style={{ backgroundImage: `url(${selectedBackground.image_url})` }}></div>
            <div className="brightness-overlay"></div>
          </div>
        )}
        <div className="pokemon-image-container">
          {isLucky && (
            <img
              src={`/images/lucky.png`}
              alt="Lucky backdrop"
              className="lucky-backdrop"
            />
          )}
          <img 
            src={currentImage}  // Use the updated image state here
            alt={pokemon.name} 
            className="pokemon-image"
          />
          {dynamax && (
            <img 
              src={'/images/dynamax.png'} 
              alt="Dynamax Badge" 
              className="max-badge" 
            />
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

      <div className="name-container">
        <NameComponent pokemon={pokemon as any} editMode={editMode} onNicknameChange={handleNicknameChange} />
      </div>

      <div className="gender-container">
      { (editMode || (gender !== null && gender !== '')) && (
          <div className="gender-wrapper">
            <Gender 
              pokemon={pokemon as any} 
              editMode={editMode} 
              onGenderChange={handleGenderChange} 
            />
          </div>
        )}
      </div>

      <div className="stats-container">
        <Weight pokemon={pokemon as any} editMode={editMode} onWeightChange={handleWeightChange} />
        <Types pokemon={pokemon} />
        <Height pokemon={pokemon as any} editMode={editMode} onHeightChange={handleHeightChange} />
      </div>

      <div className="moves-container">
        <Moves
          pokemon={pokemon}
          editMode={editMode}
          onMovesChange={handleMovesChange}
          isShadow={!!pokemon.instanceData.shadow}
          isPurified={!!pokemon.instanceData.purified}
        />
      </div>

      {showBackgrounds && (
      <div className="background-overlay" onClick={() => setShowBackgrounds(false)}>
        <div className="background-overlay-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-button" onClick={() => setShowBackgrounds(false)}>
            Close
          </button>
          <BackgroundLocationCard
            pokemon={pokemon}
            onSelectBackground={handleBackgroundSelect}
            // No selectedCostumeId passed, so it uses pokemon.variantType for filtering.
          />
        </div>
      </div>
    )}
    </div>
  );
};

export default WantedInstance;
