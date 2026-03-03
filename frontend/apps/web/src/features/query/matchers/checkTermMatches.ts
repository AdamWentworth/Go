// checkTermMatches.ts

import { generationMap, pokemonTypes } from '@/utils/constants';
import type { PokemonVariant } from "@/types/pokemonVariants";

export function checkTermMatches(
  pokemon: PokemonVariant,
  term: string
): boolean {
  // Remove pokemonTypes parameter
  const isType = pokemonTypes.includes(term.toLowerCase());
  
  // Update type check
  if (isType) {
    return pokemon.type1_name?.toLowerCase() === term || 
           pokemon.type2_name?.toLowerCase() === term;
  }
  const isNegation = term.startsWith('!');
  if (isNegation) term = term.slice(1);

  const checks = {
    type: pokemonTypes.includes(term),
    gen: term in generationMap,
    shiny: term === 'shiny',
    shadow: term === 'shadow',
    costume: term === 'costume',
    legendary: term === 'legendary',
    mythical: term === 'mythical',
    ultrabeast: term === 'ultrabeast',
    regional: term === 'regional',
    mega: term === 'mega',
    fusion: term === 'fusion',
    max: term === 'max',
    dynamax: term === 'dynamax',
    gigantamax: term === 'gigantamax',
  };

  let result = false;

  if (checks.gen)
    result = pokemon.generation === generationMap[term as keyof typeof generationMap];
  else if (checks.type)
    result = pokemon.type1_name?.toLowerCase() === term || pokemon.type2_name?.toLowerCase() === term;
  else if (checks.shiny) result = pokemon.variantType?.toLowerCase().includes('shiny') ?? false;
  else if (checks.shadow) result = pokemon.variantType?.toLowerCase().includes('shadow') ?? false;
  else if (checks.costume) result = pokemon.variantType?.toLowerCase().includes('costume') ?? false;
  else if (checks.legendary) result = pokemon.rarity?.toLowerCase().includes('legendary') ?? false;
  else if (checks.mythical) result = pokemon.rarity?.toLowerCase() === 'mythic';
  else if (checks.ultrabeast) result = pokemon.rarity?.toLowerCase().includes('ultra beast') ?? false;
  else if (checks.regional) result = pokemon.rarity?.toLowerCase().includes('regional') ?? false;
  else if (checks.mega)
    result = Array.isArray(pokemon.megaEvolutions) &&
      pokemon.megaEvolutions.length > 0 &&
      !pokemon.variantType?.toLowerCase().includes('shadow');
  else if (checks.fusion)
    result = Array.isArray(pokemon.fusion) && pokemon.fusion.length > 0;
  else if (checks.max)
    result = pokemon.variantType?.toLowerCase().includes('dynamax') ||
             pokemon.variantType?.toLowerCase().includes('gigantamax') || false;
  else if (checks.dynamax) result = pokemon.variantType?.toLowerCase().includes('dynamax') ?? false;
  else if (checks.gigantamax) result = pokemon.variantType?.toLowerCase().includes('gigantamax') ?? false;
  else result = pokemon.species_name?.toLowerCase().includes(term) ?? false;

  return isNegation ? !result : result;
}
