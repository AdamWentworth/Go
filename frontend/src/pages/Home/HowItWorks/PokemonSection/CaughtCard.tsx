// CaughtCard.jsx
import React from 'react';
import './CaughtCard.css';
import CP from '../../../../components/pokemonComponents/CP';
import Weight from '../../../../components/pokemonComponents/Weight';
import Height from '../../../../components/pokemonComponents/Height';
import Types from '../../../../components/pokemonComponents/Types';
import IV from '../../../../components/pokemonComponents/IV';

const CaughtCard = () => {
  return (
    <div className="card caught-card">
      <h3>Manage Your Collection</h3>
      <p>
      Effortlessly tag your Pokémon GO captures as <strong className="caught-text">Caught</strong> and refine their details to perfectly align with your Pokémon GO collection, ensuring a truly authentic experience.
      </p>
      
      <div className="pokemon-frame charizard centered-frame">
        {/* Top stats row */}
        <div className="stats-top">
          <div className="cp-container">
            <CP cp={3266} editMode={false} onCPChange={() => {}} />
          </div>
          <img src="/images/fav_pressed.png" alt="Favorite" className="fav-icon" />
        </div>
        
        {/* Main Pokémon image */}
        <div className="pokemon-img-container">
          <img
            src="/images/shiny/shiny_pokemon_6.png"
            alt="Shiny Charizard"
            className="pokemon-img large-img"
          />
        </div>

        <p className="pokemon-name small-text">Shiny Charizard</p>

        {/* Level and Gender row */}
        <div className="level-gender-row">
        <span className="level-text">Level: 50</span>
        <img src="/images/male-icon.png" alt="Male" className="gender-icon" />
        </div>

        {/* Stats row: Weight, Types, Height */}
        <div className="stats-row">
          <Weight
            pokemon={{ instanceData: { weight: 88 } }}
            editMode={false}
            onWeightChange={() => {}}
          />

          {/* Replace the old “type-row” div with the new <Types /> component */}
          <Types
            pokemon={{
              type1_name: 'Fire',
              type2_name: 'Flying',
              type_1_icon: '/images/types/fire.png',
              type_2_icon: '/images/types/flying.png',
            }}
          />

          <Height pokemon={{ instanceData: { height: 1.8 } }} editMode={false} />
        </div>
        
        {/* Move rows */}
        <div className="move-row">
          <img
            src="/images/types/fire.png"
            alt="Fire"
            className="move-type-icon"
          />
          <span className="move-name">Fire Spin</span>
        </div>
        <div className="move-row">
          <img
            src="/images/types/fire.png"
            alt="Fire"
            className="move-type-icon"
          />
          <span className="move-name bold">Blast Burn*</span>
        </div>
        <div className="move-row">
          <img
            src="/images/types/dragon.png"
            alt="Dragon"
            className="move-type-icon"
          />
          <span className="move-name">Dragon Claw</span>
        </div>
        {/* IV component added here */}
        <div className="iv-container">
          <IV ivs={{ Attack: 15, Defense: 15, Stamina: 15 }} />
        </div>
      </div>
    </div>
  );
};

export default CaughtCard;
