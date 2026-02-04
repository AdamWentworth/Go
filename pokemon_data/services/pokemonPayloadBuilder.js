// services/pokemonPayloadBuilder.js
// Builds the full /pokemon/pokemons payload as JS objects.

const sqlite3 = require('sqlite3').verbose();
const asyncLib = require('async');

const logger = require('../middlewares/logger');
const { getPokemonsFromDb } = require('./pokemonService');
const { getEvolutionsFromDb } = require('./evolutionsService');
const { getImagePathsForPokemon } = require('../utils/imagePaths');
const { getCostumesForPokemon, formatCostumes } = require('./costumeService');
const { getMovesForPokemon, formatMoves } = require('./movesService');
const { getAllFusions, formatFusionData } = require('./fusionService');
const { getBackgroundsForPokemon } = require('./backgroundService');
const {
  getCpForPokemon,
  getCpForMegaEvolution,
  getCpForFusionPokemon
} = require('./cpService');
const { getMegaEvolutionsForPokemon } = require('./megaService');
const { getRaidBossData } = require('./raidService');
const { appendMaxDataToPokemons } = require('./maxPokemonService');
const { appendSizesToPokemons } = require('./sizesService');

// One DB handle for this builder module.
const db = new sqlite3.Database('./data/pokego.db');

function buildFullPokemonPayload() {
  return new Promise((resolve, reject) => {
    getPokemonsFromDb((err, rows) => {
      if (err) return reject(err);

      const pokemonsWithImages = rows.map(getImagePathsForPokemon);

      // Female data enrichment (only if needed)
      const femaleUniquePokemons = pokemonsWithImages.filter(p => p.female_unique === 1);
      const femalePokemonIds = femaleUniquePokemons.map(p => p.pokemon_id);

      const continueWith = (pokemonsReady) => {
        processAdditionalPokemonData(pokemonsReady, (err2, finalPokemons) => {
          if (err2) return reject(err2);
          resolve(finalPokemons);
        });
      };

      if (femalePokemonIds.length === 0) {
        return continueWith(pokemonsWithImages);
      }

      const femalePokemonQuery = `
        SELECT * FROM female_pokemon WHERE pokemon_id IN (${femalePokemonIds.join(', ')})
      `;

      db.all(femalePokemonQuery, [], (err3, femalePokemonRows) => {
        if (err3) return reject(err3);

        const femalePokemonMap = {};
        femalePokemonRows.forEach(row => {
          femalePokemonMap[row.pokemon_id] = row;
        });

        const pokemonsWithFemaleData = pokemonsWithImages.map(pokemon => {
          if (pokemon.female_unique === 1 && femalePokemonMap[pokemon.pokemon_id]) {
            return { ...pokemon, female_data: femalePokemonMap[pokemon.pokemon_id] };
          }
          return pokemon;
        });

        continueWith(pokemonsWithFemaleData);
      });
    });
  });
}

function processAdditionalPokemonData(pokemons, callback) {
  getCostumesForPokemon(db, (err, costumes) => {
    if (err) return callback(err);

    const pokemonsWithCostumes = formatCostumes(pokemons, costumes);

    getMovesForPokemon(db, (err2, allMoves) => {
      if (err2) return callback(err2);

      const pokemonMovesQuery = "SELECT * FROM pokemon_moves";
      db.all(pokemonMovesQuery, [], (err3, pokemonMoves) => {
        if (err3) return callback(err3);

        const pokemonsWithAllData = formatMoves(
          pokemonsWithCostumes,
          allMoves,
          pokemonMoves
        );

        getAllFusions((err4, fusionRows) => {
          if (err4) return callback(err4);

          const pokemonsWithFusionData = formatFusionData(pokemonsWithAllData, fusionRows);

          // Attach CP for each fusion entry
          asyncLib.map(
            pokemonsWithFusionData,
            (pokemon, mapCallback) => {
              if (!pokemon.fusion || pokemon.fusion.length === 0) {
                return mapCallback(null, pokemon);
              }

              asyncLib.map(
                pokemon.fusion,
                (fusion, fusionCallback) => {
                  getCpForFusionPokemon(fusion.fusion_id, (err5, cpData) => {
                    if (err5) return fusionCallback(err5);

                    const cpDetails = cpData.reduce((acc, data) => {
                      acc[`cp${data.level_id}`] = data.cp;
                      return acc;
                    }, {});

                    fusionCallback(null, { ...fusion, ...cpDetails });
                  });
                },
                (err6, updatedFusions) => {
                  if (err6) return mapCallback(err6);
                  mapCallback(null, { ...pokemon, fusion: updatedFusions });
                }
              );
            },
            (err7, pokemonsWithFusionCP) => {
              if (err7) return callback(err7);

              getBackgroundsForPokemon((err8, backgroundMap) => {
                if (err8) return callback(err8);

                const pokemonsWithBackgrounds = pokemonsWithFusionCP.map(pokemon => {
                  const backgrounds = backgroundMap[pokemon.pokemon_id] || [];
                  return {
                    ...pokemon,
                    backgrounds: backgrounds.map(bg => ({
                      ...bg,
                      costume_id: bg.costume_id || null
                    }))
                  };
                });

                // Attach base CP (lvl 40/50)
                asyncLib.map(
                  pokemonsWithBackgrounds,
                  (pokemon, cb) => {
                    getCpForPokemon(pokemon.pokemon_id, (err9, cpData) => {
                      if (err9) return cb(err9);

                      const cpDetails = cpData.reduce((acc, data) => {
                        acc[`cp${data.level_id}`] = data.cp;
                        return acc;
                      }, {});

                      cb(null, { ...pokemon, ...cpDetails });
                    });
                  },
                  (err10, finalPokemons) => {
                    if (err10) return callback(err10);

                    // Evolutions
                    getEvolutionsFromDb((err11, evolutionMap) => {
                      if (err11) return callback(err11);

                      const pokemonsWithEvolutions = finalPokemons.map(pokemon => {
                        const evolutionData = evolutionMap[pokemon.pokemon_id];
                        return evolutionData ? { ...pokemon, ...evolutionData } : pokemon;
                      });

                      // Mega evolutions (+ CP)
                      asyncLib.map(
                        pokemonsWithEvolutions,
                        (pokemon, cb) => {
                          getMegaEvolutionsForPokemon(pokemon.pokemon_id, (err12, megaEvolutions) => {
                            if (err12) return cb(err12);

                            asyncLib.map(
                              megaEvolutions,
                              (megaEvolution, megaCb) => {
                                getCpForMegaEvolution(megaEvolution.id, (err13, cpData) => {
                                  if (err13) return megaCb(err13);

                                  const cpDetails = cpData.reduce((acc, data) => {
                                    acc[`cp${data.level_id}`] = data.cp;
                                    return acc;
                                  }, {});

                                  megaCb(null, { ...megaEvolution, ...cpDetails });
                                });
                              },
                              (err14, megaEvolutionsWithCp) => {
                                if (err14) return cb(err14);
                                cb(null, { ...pokemon, megaEvolutions: megaEvolutionsWithCp });
                              }
                            );
                          });
                        },
                        (err15, pokemonsWithMegaEvolutions) => {
                          if (err15) return callback(err15);

                          // Raid boss data
                          getRaidBossData((err16, raidBossData) => {
                            if (err16) return callback(err16);

                            const pokemonsWithRaidBossData = pokemonsWithMegaEvolutions.map(pokemon => {
                              const raidBossEntries = raidBossData[pokemon.pokemon_id] || [];
                              return { ...pokemon, raid_boss: raidBossEntries };
                            });

                            // Max + sizes + max again (keeps your current behavior)
                            appendMaxDataToPokemons(db, pokemonsWithRaidBossData, (err17, withMax) => {
                              if (err17) return callback(err17);

                              appendSizesToPokemons(db, withMax, (err18, withSizes) => {
                                if (err18) return callback(err18);

                                appendMaxDataToPokemons(db, withSizes, (err19, trulyFinal) => {
                                  if (err19) return callback(err19);

                                  logger.info(`Built full pokemon payload (${trulyFinal.length} pokemons)`);
                                  callback(null, trulyFinal);
                                });
                              });
                            });
                          });
                        }
                      );
                    });
                  }
                );
              });
            }
          );
        });
      });
    });
  });
}

module.exports = { buildFullPokemonPayload };
