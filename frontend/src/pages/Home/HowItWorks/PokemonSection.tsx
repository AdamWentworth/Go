// PokemonSection.jsx

import React from 'react';
import './PokemonSection.css';
import PokedexCard from './PokemonSection/PokedexCard';
import CaughtCard from './PokemonSection/CaughtCard';
import TradeCard from './PokemonSection/TradeCard';
import WantedCard from './PokemonSection/WantedCard';
import FindTradesCard from './PokemonSection/FindTradesCard';

const PokemonSection = () => {
  return (
    <div className="pokemon-section">
      {/* Top row with Pokémon button */}
      <div className="row top-row">
        <div className="pokemon-button">
          <img src="/images/btn_pokemon.png" alt="Pokémon Button" />
        </div>
      </div>

      {/* Section title */}
      <div className="row section-header">
        <h2>Pokémon</h2>
      </div>

      <div className="row">
        <PokedexCard />
        <CaughtCard />
      </div>
      <div className="row">
        <TradeCard />
        <WantedCard />
        <FindTradesCard />
      </div>
    </div>
  );
};

export default PokemonSection;
