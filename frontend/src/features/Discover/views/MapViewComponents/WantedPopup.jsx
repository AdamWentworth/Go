import React from 'react';

const WantedPopup = ({ name, location, isShiny, pokemonName, pokemonType }) => (
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
    <em>Wanted by User</em>
  </div>
);

export default WantedPopup;
