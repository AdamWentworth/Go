#!/usr/bin/env node

// Runs one matchup with an exact local PvPoke checkout. This is a development
// oracle for differential debugging; PokeGoNexus does not execute or ship it.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const scenarios = {
  leads: { shields: [1, 1], energyTurns: [0, 0] },
  closers: { shields: [0, 0], energyTurns: [0, 0] },
  switches: { shields: [1, 1], energyTurns: [4, 0] },
  chargers: { shields: [1, 1], energyTurns: [6, 0] },
  attackers: { shields: [0, 1], energyTurns: [0, 0] },
};

function usage() {
  console.error(
    "usage: run_pvpoke_matchup_oracle.js <pvpoke-dir> <league-cp> " +
      "<scenario> <candidate-id> <opponent-id>",
  );
  process.exit(2);
}

if (process.argv.length !== 7) {
  usage();
}

const [, , checkoutArg, leagueArg, scenarioSlug, candidateID, opponentID] =
  process.argv;
const checkout = path.resolve(checkoutArg);
const leagueCP = Number.parseInt(leagueArg, 10);
const scenario = scenarios[scenarioSlug];
if (!Number.isFinite(leagueCP) || !scenario) {
  usage();
}

global.host = "localhost";
global.webRoot = "";
global.siteVersion = "oracle";
global.settings = { gamemaster: "gamemaster" };
global.$ = {
  ajax() {
    // GameMaster normally loads through jQuery. The oracle injects the pinned
    // local JSON after construction instead.
  },
};

function load(relativePath) {
  const filename = path.join(checkout, "src/js", relativePath);
  vm.runInThisContext(fs.readFileSync(filename, "utf8"), { filename });
}

load("GameMaster.js");
load("battle/timeline/TimelineAction.js");
load("battle/timeline/TimelineEvent.js");
load("battle/DamageCalculator.js");
load("battle/actions/ActionLogic.js");
load("pokemon/Pokemon.js");
load("battle/Battle.js");

const dataRoot = path.join(checkout, "src/data");
const gameMaster = GameMaster.getInstance();
gameMaster.data = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "gamemaster.json"), "utf8"),
);
gameMaster.createSearchMaps();

const rankings = JSON.parse(
  fs.readFileSync(
    path.join(
      dataRoot,
      `rankings/all/overall/rankings-${leagueCP}.json`,
    ),
    "utf8",
  ),
);
const rankingByID = new Map(
  rankings.map((ranking) => [ranking.speciesId, ranking]),
);

function createPokemon(speciesID, index, battle) {
  const ranking = rankingByID.get(speciesID);
  if (!ranking) {
    throw new Error(`No overall ranking for ${speciesID}`);
  }
  const pokemon = new Pokemon(speciesID, index, battle);
  pokemon.initialize(true);
  pokemon.selectMove("fast", ranking.moveset[0]);
  pokemon.selectMove("charged", ranking.moveset[1], 0);
  if (ranking.moveset.length > 2) {
    pokemon.selectMove("charged", ranking.moveset[2], 1);
  }
  return pokemon;
}

function startingEnergy(pokemon, turns) {
  if (turns === 0) {
    return 0;
  }
  let count = Math.floor((turns * 500) / pokemon.fastMove.cooldown);
  if (count === 0) {
    count = 1;
  }
  return Math.min(pokemon.fastMove.energyGain * count, 100);
}

const battle = new Battle();
battle.setCP(leagueCP);
const candidate = createPokemon(candidateID, 0, battle);
const opponent = createPokemon(opponentID, 1, battle);
battle.setNewPokemon(candidate, 0, false);
battle.setNewPokemon(opponent, 1, false);
candidate.reset();
opponent.reset();
candidate.setShields(scenario.shields[0]);
opponent.setShields(scenario.shields[1]);
candidate.startEnergy = startingEnergy(candidate, scenario.energyTurns[0]);
// This intentionally preserves the pinned Ranker.js opponent-energy bug.
opponent.startEnergy =
  scenario.energyTurns[1] === 0
    ? 0
    : startingEnergy(candidate, scenario.energyTurns[0]);
battle.setDebugMode(true);
const timeline = battle.simulate();
const ratings = battle.getBattleRatings();

battle.debug();
console.log(
  JSON.stringify(
    {
      source: "PvPoke",
      scenario: scenarioSlug,
      candidate: {
        id: candidateID,
        rating: ratings[0],
        hp: candidate.hp,
        maxHP: candidate.stats.hp,
        energy: candidate.energy,
        shields: candidate.shields,
        buffs: candidate.statBuffs,
      },
      opponent: {
        id: opponentID,
        rating: ratings[1],
        hp: opponent.hp,
        maxHP: opponent.stats.hp,
        energy: opponent.energy,
        shields: opponent.shields,
        buffs: opponent.statBuffs,
      },
      timeline,
    },
    null,
    2,
  ),
);
