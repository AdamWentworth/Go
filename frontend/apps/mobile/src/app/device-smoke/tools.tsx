import { Redirect, useLocalSearchParams } from "expo-router";
import type {
  BasePokemon,
  Move,
  PokemonPvPRankingsPayload,
} from "@pokemongonexus/shared-contracts/pokemon";
import { runtimeConfig } from "../../config/runtimeConfig";
import { NativeMaxScreen } from "../../screens/NativeMaxScreen";
import { NativePokedexScreen } from "../../screens/NativePokedexScreen";
import { NativePvpScreen } from "../../screens/NativePvpScreen";
import { NativeRaidScreen } from "../../screens/NativeRaidScreen";
import { NativeRankingsScreen } from "../../screens/NativeRankingsScreen";

const ASSET_BASE_URL = runtimeConfig.api.frontendAppUrl;
const imageUri = `${ASSET_BASE_URL}/images/shiny/shiny_pokemon_1.png`;
const fastMove = {
  move_id: 1,
  name: "Vine Whip",
  raid_power: 10,
  raid_energy: 8,
  raid_cooldown: 1,
  is_fast: 1,
  type_name: "grass",
  type: "grass",
} as Move;
const chargedMove = {
  ...fastMove,
  move_id: 2,
  name: "Power Whip",
  raid_power: 90,
  raid_energy: -50,
  raid_cooldown: 2.5,
  is_fast: 0,
} as Move;
const battleCatalog = [
  {
    pokemon_id: 1,
    name: "Bulbasaur",
    pokedex_number: 1,
    attack: 118,
    defense: 111,
    stamina: 128,
    available: 1,
    cp40: 1_000,
    cp50: 1_200,
    type1_name: "grass",
    type2_name: "poison",
    image_url: imageUri,
    moves: [fastMove, chargedMove],
    raid_boss: [
      {
        id: 1,
        pokemon_id: 1,
        name: "Bulbasaur",
        form: "Normal",
        type: "one-star",
        boosted_weather: "",
        max_boosted_cp: 500,
        max_unboosted_cp: 400,
        min_boosted_cp: 300,
        min_unboosted_cp: 200,
        possible_shiny: 1,
        tier: "one-star",
      },
    ],
    max: [
      {
        pokemon_id: 1,
        dynamax: 1,
        gigantamax: 0,
        dynamax_release_date: null,
        gigantamax_release_date: null,
      },
    ],
  },
] as BasePokemon[];
const pvpPayload = {
  source: null,
  leagues: {
    great: {
      key: "great",
      label: "Great",
      cpLimit: 1_500,
      entries: [
        {
          rank: 1,
          sourceRank: 1,
          speciesId: "bulbasaur",
          name: "Bulbasaur",
          pokemonId: 1,
          variantKind: "pokemon",
          imageUrl: imageUri,
          types: ["grass"],
          moveset: [
            {
              id: "vine-whip",
              name: "Vine Whip",
              type: "grass",
              kind: "fast",
              power: 5,
              energyGain: 8,
              energyCost: 0,
              turns: 2,
              buff: {
                attackerAttack: 0,
                attackerDefense: 0,
                targetAttack: 0,
                targetDefense: 0,
                chance: 0,
              },
            },
            {
              id: "power-whip",
              name: "Power Whip",
              type: "grass",
              kind: "charged",
              power: 90,
              energyGain: 0,
              energyCost: 50,
              turns: 1,
              buff: {
                attackerAttack: 0,
                attackerDefense: 0,
                targetAttack: 0,
                targetDefense: 0,
                chance: 0,
              },
            },
          ],
          score: 95,
          rating: 700,
          categoryScores: [91, 90, 89, 88, 87, 86],
          matchups: [],
          counters: [],
          moveUsage: [],
          recommendedLevel: 20,
          attackIv: 0,
          defenseIv: 15,
          staminaIv: 15,
          battleAttack: 121,
          battleDefense: 120,
          battleHp: 125,
        },
        {
          rank: 2,
          sourceRank: 2,
          speciesId: "ivysaur",
          name: "Ivysaur",
          pokemonId: 2,
          variantKind: "pokemon",
          imageUrl: imageUri,
          types: ["grass", "poison"],
          moveset: [
            {
              id: "razor-leaf",
              name: "Razor Leaf",
              type: "grass",
              kind: "fast",
              power: 10,
              energyGain: 4,
              energyCost: 0,
              turns: 2,
              buff: {
                attackerAttack: 0,
                attackerDefense: 0,
                targetAttack: 0,
                targetDefense: 0,
                chance: 0,
              },
            },
            {
              id: "sludge-bomb",
              name: "Sludge Bomb",
              type: "poison",
              kind: "charged",
              power: 80,
              energyGain: 0,
              energyCost: 50,
              turns: 1,
              buff: {
                attackerAttack: 0,
                attackerDefense: 0,
                targetAttack: 0,
                targetDefense: 0,
                chance: 0,
              },
            },
          ],
          score: 92,
          rating: 680,
          categoryScores: [89, 88, 87, 86, 85, 84],
          matchups: [],
          counters: [],
          moveUsage: [],
          recommendedLevel: 22,
          attackIv: 1,
          defenseIv: 14,
          staminaIv: 14,
          battleAttack: 118,
          battleDefense: 124,
          battleHp: 127,
        },
      ],
    },
    ultra: { key: "ultra", label: "Ultra", cpLimit: 2_500, entries: [] },
    master: { key: "master", label: "Master", cpLimit: null, entries: [] },
  },
  formats: [],
} as PokemonPvPRankingsPayload;
const pokedexEntry = {
  id: "0001-shiny",
  pokemonId: 1,
  pokedexNumber: 1,
  name: "Shiny Bulbasaur",
  imageUri,
  typeIconUris: [],
  maxKind: null,
  category: "shiny" as const,
  generation: 1,
  registered: true,
};
const rankingRow = {
  caughtUsers: 3,
  entry: pokedexEntry,
  mostWantedUsers: 2,
  personal: { caughtCount: 1, registered: true, tradeCount: 0, wanted: true },
  rank: 1,
  wantedUsers: 4,
};

const noOp = () => undefined;

export default function DeviceSmokeToolsRoute() {
  const params = useLocalSearchParams<{ tool?: string | string[] }>();
  if (!runtimeConfig.mobile.deviceSmokeMode) return <Redirect href="/" />;
  const tool = Array.isArray(params.tool) ? params.tool[0] : params.tool;

  if (tool === "pokedex") {
    return (
      <NativePokedexScreen
        assetBaseUrl={ASSET_BASE_URL}
        entries={[pokedexEntry]}
        onBack={noOp}
        onOpenEntry={noOp}
        onRetry={noOp}
      />
    );
  }
  if (tool === "raid") {
    return (
      <NativeRaidScreen
        assetBaseUrl={ASSET_BASE_URL}
        catalog={battleCatalog}
        onBack={noOp}
        onMethodology={noOp}
        onOpenPokemon={noOp}
        onRetry={noOp}
        signedIn={false}
      />
    );
  }
  if (tool === "pvp") {
    return (
      <NativePvpScreen
        assetBaseUrl={ASSET_BASE_URL}
        catalog={battleCatalog}
        onBack={noOp}
        onMethodology={noOp}
        onRetry={noOp}
        payload={pvpPayload}
        signedIn={false}
      />
    );
  }
  if (tool === "max") {
    return (
      <NativeMaxScreen
        assetBaseUrl={ASSET_BASE_URL}
        catalog={battleCatalog}
        onBack={noOp}
        onOpenPokemon={noOp}
        onRetry={noOp}
        signedIn={false}
      />
    );
  }
  if (tool === "rankings") {
    return (
      <NativeRankingsScreen
        assetBaseUrl={ASSET_BASE_URL}
        collectorCount={5}
        onBack={noOp}
        onChangeCategory={noOp}
        onChangeCollectionFilter={noOp}
        onChangeMode={noOp}
        onChangeQuery={noOp}
        onOpenEntry={noOp}
        onRetry={noOp}
        privacyThreshold={3}
        rows={[rankingRow]}
        selectedCategory="all"
        selectedCollectionFilter="all"
        selectedMode="wanted"
        showCollectionFilters
        snapshotLabel="Recently updated"
      />
    );
  }
  return <Redirect href="/device-smoke/home" />;
}
