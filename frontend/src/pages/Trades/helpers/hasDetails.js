// hasDetails.js

// Function to check if a Pokémon has any details
export const hasDetails = (pokemon) => {
    if (!pokemon) {
      return false;
    }
  
    // Check if at least one move is present
    const hasMoves = Boolean(
      pokemon.fast_move_id ||
      pokemon.charged_move1_id ||
      pokemon.charged_move2_id
    );
  
    // Check if any IV is defined (and optionally > 0 if you don't want 0 to count)
    const hasIVs =
      (typeof pokemon.attack_iv === 'number') ||
      (typeof pokemon.defense_iv === 'number') ||
      (typeof pokemon.stamina_iv === 'number');
  
    // Check if there is non-zero weight or height (if 0 is not valid data)
    const hasWeightOrHeight =
      (typeof pokemon.weight === 'number' && pokemon.weight > 0) ||
      (typeof pokemon.height === 'number' && pokemon.height > 0);
  
    // Finally, check if there's any one of these conditions
    const detailsExist = Boolean(
      hasMoves ||
      hasIVs ||
      hasWeightOrHeight ||
      pokemon.location_caught ||
      pokemon.date_caught
    );
    return detailsExist;
  };