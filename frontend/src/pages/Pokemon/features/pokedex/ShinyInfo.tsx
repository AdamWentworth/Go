// ShinyInfo.tsx

import React from 'react';
import './ShinyInfo.css';
import { formatShinyRarity, getLastWord } from '@/utils/formattingHelpers';

// Types
import type { PokemonVariant, AllVariants } from '@/types/pokemonVariants';

export interface ShinyInfoProps {
  pokemon: PokemonVariant;
  allPokemonData: AllVariants;
  isMale: boolean;
}

const ShinyInfo: React.FC<ShinyInfoProps> = ({ pokemon, allPokemonData, isMale }) => {
  const getBaseName = (name: string): string =>
    name.substring(name.lastIndexOf(' ') + 1);

  const baseName = pokemon.variantType?.includes('mega') ? pokemon.name : getBaseName(pokemon.name);
  const showShiny = pokemon.shiny_available === 1;

  const getPreviousEvolution = (): PokemonVariant | null => {
    if (pokemon.evolves_from && pokemon.evolves_from.length > 0) {
      const prev = allPokemonData.find(
        p => p.pokemon_id === pokemon.evolves_from![0]
      );
      return prev || null;
    }
    return null;
  };

  const displayShinyRarity = (): string => {
    const rarityParam = pokemon.shiny_rarity ?? '';
    const defaultRarity = formatShinyRarity(rarityParam);
    const prevEvo = getPreviousEvolution();
    if (
      defaultRarity === 'Full Odds ~1/500' &&
      pokemon.evolves_from &&
      prevEvo
    ) {
      return pokemon.pokemon_id > prevEvo.pokemon_id
        ? `Evolve ${getLastWord(prevEvo.name)}`
        : defaultRarity;
    }
    return defaultRarity;
  };

  const maleImg = pokemon.image_url_shiny;
  const femaleImg = pokemon.female_data?.shiny_image_url || pokemon.image_url_shiny;

  return (
    <div className="column shiny-info-column">
      <h1>Shiny {baseName}</h1>
      <img
        src={isMale ? maleImg : femaleImg}
        alt={`${baseName} Shiny`}
      />
      {showShiny && (
        <div className="shiny-rarity-info">
          <strong>Shiny Rarity:</strong>{' '}
          {displayShinyRarity()
            .split('\n')
            .map((line, idx) => (
              <React.Fragment key={idx}>
                {line}
                <br />
              </React.Fragment>
            ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(ShinyInfo);
