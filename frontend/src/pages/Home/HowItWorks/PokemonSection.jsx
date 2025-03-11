import React from 'react';
import './PokemonSection.css';

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

      {/* First row: Cataloging and Managing Collection */}
      <div className="row">
        <div className="card">
          <h3>Explore the Pokédex</h3>
          <p>
            Browse the comprehensive Pokémon Catalog to view every available species, complete with essential details like release dates and availability.
          </p>
        </div>
        <div className="card">
          <h3>Manage Your Collection</h3>
          <p>
            Seamlessly tag your Pokémon GO captures as <strong className="caught-text">Caught</strong> – ensuring each entry mirrors your Pokémon GO collection for an authentic experience.
          </p>
        </div>
      </div>

      {/* Second row: Trading Functions */}
      <div className="row">
        <div className="card trade">
          <h3>Add to Your Trade List</h3>
          <p>
            Use tags to list your Pokémon for <strong className="trade-text">Trade</strong> and customize trade preferences for each listed Pokémon as you desire.
          </p>
          <div className="pokemon-frame detective-pikachu centered-frame">
            <img
              src="/images/costumes_shiny/pokemon_25_detective_shiny.png"
              alt="Shiny Detective Pikachu"
              className="pokemon-img large-img"
            />
            <p className="pokemon-name small-text">Shiny Detective Pikachu</p>
          </div>
        </div>

        <div className="card wanted">
          <h3>Add to Your Wanted List</h3>
          <p>
            Use tags to track your <strong className="wanted-text">Wanted</strong> Pokémon and mark as <strong>Most Wanted</strong> to highlight the ones you value most.
          </p>
          <div className="pokemon-frame nightcap-snorlax centered-frame">
            <img
              src="/images/costumes_shiny/pokemon_143_nightcap_shiny.png"
              alt="Shiny Nightcap Snorlax"
              className="pokemon-img large-img"
            />
            <p className="pokemon-name small-text">Shiny Nightcap Snorlax</p>
          </div>
        </div>

        <div className="card">
          <h3>Find Trades</h3>
          <p>
            Discover and coordinate trades with fellow trainers, easily filtered by location or event.
          </p>
          <div className="trade-images">
            <div className="pokemon-frame findtrades-detective-pikachu">
              <img
                src="/images/costumes_shiny/pokemon_25_detective_shiny.png"
                alt="Shiny Detective Pikachu"
                className="pokemon-img"
              />
              <p className="pokemon-name smaller-text">Shiny Detective Pikachu</p>
            </div>
            <img
              src="/images/pogo_trade_icon.png"
              alt="Trade Icon"
              className="trade-icon"
            />
            <div className="pokemon-frame findtrades-nightcap-snorlax">
              <img
                src="/images/costumes_shiny/pokemon_143_nightcap_shiny.png"
                alt="Shiny Nightcap Snorlax"
                className="pokemon-img"
              />
              <p className="pokemon-name smaller-text">Shiny Nightcap Snorlax</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokemonSection;
