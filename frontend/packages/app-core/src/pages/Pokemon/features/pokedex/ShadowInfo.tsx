// ShadowInfo.tsx
import React from 'react';
import './ShadowInfo.css';
import { formatShinyShadowRarity, getLastWord } from '@/utils/formattingHelpers';

// Types
import type { PokemonVariant, AllVariants } from '@/types/pokemonVariants';

export interface ShadowInfoProps {
  pokemon: PokemonVariant;
  allPokemonData: AllVariants;
  isMale: boolean;
}

const ShadowInfo: React.FC<ShadowInfoProps> = ({ pokemon, allPokemonData, isMale }) => {
  const getBaseName = (name: string): string =>
    name.substring(name.lastIndexOf(' ') + 1);

  const baseName = getBaseName(pokemon.name);
  const showShinyShadow = pokemon.shadow_shiny_available === 1;

  const getPreviousEvolution = (): PokemonVariant | null => {
    if (pokemon.evolves_from && pokemon.evolves_from.length > 0) {
      const prev = allPokemonData.find(
        p => p.pokemon_id === pokemon.evolves_from![0]
      );
      return prev || null;
    }
    return null;
  };

  const displayShinyShadowRarity = (): string => {
    // Coalesce null to empty string for formatter
    const rarityParam = pokemon.shiny_shadow_rarity ?? '';
    const defaultRarity = formatShinyShadowRarity(rarityParam);
    const prevEvo = getPreviousEvolution();
    if (
      defaultRarity === 'Unavailable' &&
      pokemon.evolves_from &&
      prevEvo
    ) {
      return `Evolve ${getLastWord(prevEvo.name)}`;
    }
    return defaultRarity;
  };

  const maleShadow = pokemon.image_url_shadow;
  const femaleShadow = pokemon.female_data?.shadow_image_url || pokemon.image_url_shadow;
  const maleShinyShadow = pokemon.image_url_shiny_shadow!;
  const femaleShinyShadow =
    pokemon.female_data?.shiny_shadow_image_url || pokemon.image_url_shiny_shadow!;

  return (
    <div className="column shadow-info-column">
      <h1>Shadow {baseName}</h1>

      <div className="images-container">
        <img
          src={isMale ? maleShadow : femaleShadow}
          alt={`Shadow ${baseName}`}
        />
        {showShinyShadow && (
          <img
            src={isMale ? maleShinyShadow : femaleShinyShadow}
            alt={`Shiny Shadow ${baseName}`}
            className="shiny-shadow-image"
          />
        )}
      </div>

      {showShinyShadow && (
        <div className="shiny-rarity-info">
          <strong>Shiny Shadow Rarity:</strong>{' '}
          {displayShinyShadowRarity()
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

export default React.memo(ShadowInfo);
