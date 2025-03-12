// PokedexCard.jsx

import React from 'react';
import './PokedexCard.css';

const PokedexCard = () => {
  return (
    <div className="card">
      <h3>Explore the Pokédex</h3>
      <p>
        Browse the comprehensive Pokémon Catalog to view every available species, and variant per species - Complete with essential details like release dates and availability.
      </p>
      <div className="pokemon-frame bulbasaur default">
        <img src="/images/default/pokemon_1.png" alt="Bulbasaur" className="pokemon-img large-img" />
        <p className="pokemon-name">Bulbasaur</p>
      </div>
      <div className="variants-grid">
        <div className="pokemon-frame variant shiny">
          <img src="/images/shiny/shiny_pokemon_1.png" alt="Shiny Bulbasaur" className="pokemon-img" />
          <p className="pokemon-name">Shiny</p>
        </div>
        <div className="pokemon-frame variant shadow">
          <img src="/images/shadow/shadow_pokemon_1.png" alt="Shadow Bulbasaur" className="pokemon-img" />
          <p className="pokemon-name">Shadow</p>
        </div>
        <div className="pokemon-frame variant dynamax" style={{ position: 'relative' }}>
          <img src="/images/default/pokemon_1.png" alt="Dynamax Bulbasaur" className="pokemon-img" />
          <img src="/images/dynamax.png" alt="Dynamax Icon" className="dynamax-icon" />
          <p className="pokemon-name">Dynamax</p>
        </div>
        <div className="pokemon-frame variant costume">
          <img src="/images/costumes/pokemon_1_fall_default.png" alt="Bulbasaur Fall" className="pokemon-img" />
          <p className="pokemon-name">Fall</p>
        </div>
        <div className="pokemon-frame variant costume">
          <img src="/images/costumes/pokemon_1_party_hat_default.png" alt="Bulbasaur Party Hat" className="pokemon-img" />
          <p className="pokemon-name">Party Hat</p>
        </div>
        <div className="pokemon-frame variant costume">
          <img src="/images/costumes/pokemon_1_visor_default.png" alt="Bulbasaur Visor" className="pokemon-img" />
          <p className="pokemon-name">Visor</p>
        </div>
        <div className="pokemon-frame variant shiny-shadow">
          <img src="/images/shiny_shadow/shiny_shadow_pokemon_1.png" alt="Shiny Shadow Bulbasaur" className="pokemon-img" />
          <p className="pokemon-name">Shiny Shadow</p>
        </div>
        <div className="pokemon-frame variant dynamax-shiny" style={{ position: 'relative' }}>
          <img src="/images/shiny/shiny_pokemon_1.png" alt="Dynamax Shiny Bulbasaur" className="pokemon-img" />
          <img src="/images/dynamax.png" alt="Dynamax Icon" className="dynamax-icon" />
          <p className="pokemon-name">Dynamax Shiny</p>
        </div>
        <div className="pokemon-frame variant costume-shiny">
          <img src="/images/costumes_shiny/pokemon_1_fall_shiny.png" alt="Shiny Bulbasaur Fall" className="pokemon-img" />
          <p className="pokemon-name">Shiny Fall</p>
        </div>
        <div className="pokemon-frame variant costume-shiny">
          <img src="/images/costumes_shiny/pokemon_1_party_hat_shiny.png" alt="Shiny Bulbasaur Party Hat" className="pokemon-img" />
          <p className="pokemon-name">Shiny Party Hat</p>
        </div>
        <div className="pokemon-frame variant costume-shiny">
          <img src="/images/costumes_shiny/pokemon_1_visor_shiny.png" alt="Shiny Bulbasaur Visor" className="pokemon-img" />
          <p className="pokemon-name">Shiny Visor</p>
        </div>
      </div>
    </div>
  );
};

export default PokedexCard;
