import type { PokemonVariant } from "@/types/pokemonVariants";
import type { Move } from "@/types/pokemonSubTypes";

type CanonicalAttacker = {
  pokemonId: number;
  name: string;
  variantId: string;
  variantType: string;
  attack: number;
  defense: number;
  stamina: number;
  types: [string, string?];
  moves: Move[];
};

export const canonicalRaidMove = (
  name: string,
  type: string,
  isFast: boolean,
  power: number,
  cooldown: number,
  energy: number,
): Move =>
  ({
    name,
    type,
    type_name: type,
    is_fast: isFast ? 1 : 0,
    raid_power: power,
    raid_cooldown: cooldown,
    raid_energy: energy,
    fusion_id: null,
  }) as unknown as Move;

const canonicalRaidAttacker = ({
  pokemonId,
  name,
  variantId,
  variantType,
  attack,
  defense,
  stamina,
  types,
  moves,
}: CanonicalAttacker): PokemonVariant =>
  ({
    pokemon_id: pokemonId,
    pokedex_number: pokemonId,
    name,
    species_name: name,
    variant_id: variantId,
    variantType,
    attack,
    defense,
    stamina,
    type1_name: types[0],
    type2_name: types[1] ?? "none",
    moves,
    raid_boss: [],
    backgrounds: [],
    currentImage: "",
    image_url: "",
    sprite_url: "",
    fusion_id: null,
  }) as unknown as PokemonVariant;

const psychoCut = canonicalRaidMove("Psycho Cut", "psychic", true, 4, 500, 7);
const psystrike = canonicalRaidMove("Psystrike", "psychic", false, 95, 2500, -50);

export const canonicalOverallRaidAttackers: PokemonVariant[] = [
  canonicalRaidAttacker({
    pokemonId: 384,
    name: "Mega Rayquaza",
    variantId: "rayquaza-mega",
    variantType: "mega",
    attack: 377,
    defense: 210,
    stamina: 227,
    types: ["dragon", "flying"],
    moves: [
      canonicalRaidMove("Air Slash", "flying", true, 12, 1000, 8),
      canonicalRaidMove("Dragon Tail", "dragon", true, 14, 1000, 8),
      canonicalRaidMove("Outrage", "dragon", false, 110, 4000, -50),
      canonicalRaidMove("Dragon Ascent", "flying", false, 140, 3500, -50),
    ],
  }),
  canonicalRaidAttacker({
    pokemonId: 150,
    name: "Mega Mewtwo Y",
    variantId: "mewtwo-mega-y",
    variantType: "mega_y",
    attack: 413,
    defense: 223,
    stamina: 228,
    types: ["psychic"],
    moves: [
      canonicalRaidMove("Confusion", "psychic", true, 19, 1500, 14),
      psychoCut,
      psystrike,
      canonicalRaidMove("Shadow Ball", "ghost", false, 100, 3000, -50),
    ],
  }),
  canonicalRaidAttacker({
    pokemonId: 150,
    name: "Mega Mewtwo X",
    variantId: "mewtwo-mega-x",
    variantType: "mega_x",
    attack: 399,
    defense: 215,
    stamina: 228,
    types: ["psychic", "fighting"],
    moves: [
      canonicalRaidMove("Counter", "fighting", true, 13, 1000, 9),
      psychoCut,
      psystrike,
      canonicalRaidMove("Focus Blast", "fighting", false, 140, 3500, -100),
    ],
  }),
  canonicalRaidAttacker({
    pokemonId: 890,
    name: "Eternatus",
    variantId: "eternatus-default",
    variantType: "default",
    attack: 278,
    defense: 192,
    stamina: 268,
    types: ["poison", "dragon"],
    moves: [
      canonicalRaidMove("Dragon Tail", "dragon", true, 14, 1000, 8),
      canonicalRaidMove("Poison Jab", "poison", true, 13, 1000, 9),
      canonicalRaidMove("Dynamax Cannon", "dragon", false, 215, 1500, -100),
      canonicalRaidMove("Sludge Bomb", "poison", false, 85, 2500, -50),
    ],
  }),
  canonicalRaidAttacker({
    pokemonId: 486,
    name: "Shadow Regigigas",
    variantId: "regigigas-shadow",
    variantType: "shadow",
    attack: 287,
    defense: 210,
    stamina: 221,
    types: ["normal"],
    moves: [
      canonicalRaidMove("Hidden Power", "normal", true, 15, 1500, 15),
      canonicalRaidMove("Zen Headbutt", "psychic", true, 11, 1000, 9),
      canonicalRaidMove("Crush Grip", "normal", false, 210, 2000, -100),
      canonicalRaidMove("Giga Impact", "normal", false, 200, 4500, -100),
    ],
  }),
  canonicalRaidAttacker({
    pokemonId: 888,
    name: "Zacian",
    variantId: "zacian-crowned-sword",
    variantType: "default",
    attack: 332,
    defense: 240,
    stamina: 192,
    types: ["fairy", "steel"],
    moves: [
      canonicalRaidMove("Air Slash", "flying", true, 12, 1000, 8),
      canonicalRaidMove("Metal Claw", "steel", true, 6, 500, 5),
      canonicalRaidMove("Behemoth Blade", "steel", false, 200, 3500, -100),
      canonicalRaidMove("Play Rough", "fairy", false, 90, 3000, -50),
    ],
  }),
];

export const canonicalOverallExpectation = [
  {
    name: "Mega Rayquaza",
    fastMove: "Dragon Tail",
    chargedMove: "Dragon Ascent",
  },
  {
    name: "Mega Mewtwo Y",
    fastMove: "Confusion",
    chargedMove: "Psystrike",
  },
  {
    name: "Mega Mewtwo X",
    fastMove: "Counter",
    chargedMove: "Psystrike",
  },
] as const;
