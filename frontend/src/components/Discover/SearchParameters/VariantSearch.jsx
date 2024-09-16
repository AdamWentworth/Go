import React from 'react';

const VariantSearch = ({ pokemon, setPokemon, isShiny, setIsShiny, isShadow, setIsShadow, costume, setCostume }) => {
  return (
    <div className="pokemon-variant">
      <h3>Pokémon Variant</h3>
      <div>
        <label>Pokémon: </label>
        <input
          type="text"
          value={pokemon}
          onChange={(e) => setPokemon(e.target.value)}
          placeholder="Enter Pokémon name"
        />
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={isShiny}
            onChange={(e) => setIsShiny(e.target.checked)}
          />
          Shiny
        </label>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={isShadow}
            onChange={(e) => setIsShadow(e.target.checked)}
          />
          Shadow
        </label>
      </div>

      <div>
        <label>Costume: </label>
        <select value={costume} onChange={(e) => setCostume(e.target.value)}>
          <option value="">None</option>
          <option value="pikachu-hat">Pikachu Hat</option>
          <option value="halloween">Halloween</option>
          <option value="holiday">Holiday</option>
        </select>
      </div>
    </div>
  );
};

export default VariantSearch;
