import React from 'react';

const TradePopup = ({ name, location, isShiny, pokemonName, pokemonType }) => (
  <div>
    <strong>{name}</strong>
    <br />
    Location: {location}
    <br />
    Shiny: {isShiny}
    <br />
    Pokémon: {pokemonName}
    <br />
    Type: {pokemonType}
    <br />
    <em>Available for Trade</em>
  </div>
);

export default TradePopup;
