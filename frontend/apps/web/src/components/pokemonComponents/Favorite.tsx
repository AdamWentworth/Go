// Favorite.tsx

import React, { useState, useEffect } from 'react';
import './Favorite.css';
import type { PokemonInstance } from '@/types/pokemonInstance';

type FavoriteProps = {
  pokemon: {
    instanceData: Pick<PokemonInstance, 'favorite'>;
  };
  editMode: boolean;
  onFavoriteChange: (value: boolean) => void;
};

const FavoriteComponent: React.FC<FavoriteProps> = ({ pokemon, editMode, onFavoriteChange }) => {
  const [isFavorite, setIsFavorite] = useState(pokemon.instanceData.favorite);

  const favoriteImage = isFavorite
    ? '/images/fav_pressed.png'
    : '/images/fav_unpressed.png';

  const toggleFavorite = () => {
    if (editMode) {
      const newFavoriteStatus = !isFavorite;
      setIsFavorite(newFavoriteStatus);
      onFavoriteChange(newFavoriteStatus);
    }
  };

  useEffect(() => {
    setIsFavorite(pokemon.instanceData.favorite);
  }, [pokemon]);

  return (
    <div
      className={`favorite-component ${editMode ? 'editable' : ''} ${
        isFavorite ? 'filled' : 'not-filled'
      }`}
      onClick={toggleFavorite}
    >
      <img src={favoriteImage} alt={isFavorite ? 'Favorite' : 'Not Favorite'} />
    </div>
  );
};

export default FavoriteComponent;
