// sortPokedexLists.ts

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokedexLists } from '@/types/pokedex';

export default function sortPokedexLists(variants: PokemonVariant[]): PokedexLists {
  const lists: PokedexLists = {
    default: [],
    shiny: [],
    costume: [],
    shadow: [],
    'shiny costume': [],
    'shiny shadow': [],
    'shadow costume': [],
    mega: [],
    'shiny mega': [],
    dynamax: [],
    'shiny dynamax': [],
    gigantamax: [],
    'shiny gigantamax': [],
    fusion: [],
    'shiny fusion': []
  };

  variants.forEach((variant: PokemonVariant) => {
    const vt = variant.variantType.toLowerCase();

    if (vt === 'default') {
      lists.default.push(variant);
    } else if (vt === 'shiny') {
      lists.shiny.push(variant);
    } else if (vt.includes('fusion')) {
      if (vt.includes('shiny')) {
        lists['shiny fusion'].push(variant);
      } else {
        lists.fusion.push(variant);
      }
    } else if (vt.includes('gigantamax')) {
      if (vt.includes('shiny')) {
        lists['shiny gigantamax'].push(variant);
      } else {
        lists.gigantamax.push(variant);
      }
    } else if (vt.includes('dynamax')) {
      if (vt.includes('shiny')) {
        lists['shiny dynamax'].push(variant);
      } else {
        lists.dynamax.push(variant);
      }
    } else if (vt.includes('mega') || vt.includes('primal')) {
      if (vt.includes('shiny')) {
        lists['shiny mega'].push(variant);
      } else {
        lists.mega.push(variant);
      }
    } else if (vt.includes('shiny') && vt.includes('costume')) {
      lists['shiny costume'].push(variant);
    } else if (vt.includes('shiny') && vt.includes('shadow')) {
      lists['shiny shadow'].push(variant);
    } else if (vt.includes('shadow') && vt.includes('costume') && !vt.includes('shiny')) {
      lists['shadow costume'].push(variant);
    } else if (vt.includes('costume') && !vt.includes('shiny')) {
      lists.costume.push(variant);
    } else if (vt.includes('shadow') && !vt.includes('shiny')) {
      lists.shadow.push(variant);
    } else {
      lists.default.push(variant);
    }
  });

  return lists;
}
