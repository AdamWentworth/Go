// sortPokedexLists.ts

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokedexLists } from '@/types/pokedex';

const LIST_NAMES = [
  'default',
  'shiny',
  'costume',
  'shadow',
  'shiny costume',
  'shiny shadow',
  'shadow costume',
  'mega',
  'shiny mega',
  'dynamax',
  'shiny dynamax',
  'gigantamax',
  'shiny gigantamax',
  'fusion',
  'shiny fusion',
] as const;

type ListName = (typeof LIST_NAMES)[number];

const bucketCache = new Map<string, ListName>();
const listsCacheByArray = new WeakMap<PokemonVariant[], PokedexLists>();

function classifyVariantType(variantType: string): ListName {
  const cached = bucketCache.get(variantType);
  if (cached) return cached;

  const vt = variantType.toLowerCase();
  let bucket: ListName = 'default';

  if (vt === 'shiny') {
    bucket = 'shiny';
  } else if (vt.includes('fusion')) {
    bucket = vt.includes('shiny') ? 'shiny fusion' : 'fusion';
  } else if (vt.includes('gigantamax')) {
    bucket = vt.includes('shiny') ? 'shiny gigantamax' : 'gigantamax';
  } else if (vt.includes('dynamax')) {
    bucket = vt.includes('shiny') ? 'shiny dynamax' : 'dynamax';
  } else if (vt.includes('mega') || vt.includes('primal')) {
    bucket = vt.includes('shiny') ? 'shiny mega' : 'mega';
  } else if (vt.includes('shiny') && vt.includes('costume')) {
    bucket = 'shiny costume';
  } else if (vt.includes('shiny') && vt.includes('shadow')) {
    bucket = 'shiny shadow';
  } else if (vt.includes('shadow') && vt.includes('costume')) {
    bucket = 'shadow costume';
  } else if (vt.includes('costume')) {
    bucket = 'costume';
  } else if (vt.includes('shadow')) {
    bucket = 'shadow';
  }

  bucketCache.set(variantType, bucket);
  return bucket;
}

function createEmptyLists(): PokedexLists {
  return LIST_NAMES.reduce<PokedexLists>((acc, name) => {
    acc[name] = [];
    return acc;
  }, {} as PokedexLists);
}

export default function sortPokedexLists(variants: PokemonVariant[]): PokedexLists {
  const cached = listsCacheByArray.get(variants);
  if (cached) return cached;

  const lists: PokedexLists = createEmptyLists();

  for (const variant of variants) {
    const bucket = classifyVariantType(variant.variantType);
    lists[bucket].push(variant);
  }

  listsCacheByArray.set(variants, lists);
  return lists;
}
