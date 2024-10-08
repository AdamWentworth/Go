// pokemonUtils.js

const { faker } = require('@faker-js/faker');
const fs = require('fs');

// Load Pokémon data and keys from JSON files
const pokemonData = JSON.parse(fs.readFileSync('./pokemon.json', 'utf8'));
const pokemonKeys = JSON.parse(fs.readFileSync('./pokemonKeys.json', 'utf8')); // Now using pokemonKeys

// Helper function to generate random coordinates within Vancouver
function getRandomVancouverCoordinates() {
    const latitude = faker.number.float({ min: 49.198, max: 49.316, precision: 0.00001 });
    const longitude = faker.number.float({ min: -123.264, max: -123.023, precision: 0.00001 });

    return { latitude, longitude };
}

// Function to get a random Pokémon key
function getRandomPokemonKey() {
    const randomKey = faker.helpers.arrayElement(pokemonKeys);
    return randomKey;
}

// Helper function to parse pokemonKey and determine variant details
function parsePokemonKey(pokemonKey) {
    const keyParts = pokemonKey.split('-');
    const pokemon_id = parseInt(keyParts[0], 10); // The first part is the pokemon_id
    const variantPart = keyParts.slice(1).join('-'); // The rest is the variant part

    let isShiny = false;
    let isShadow = false;
    let costumeName = null;
    let formName = null; // For mega and primal forms

    if (!variantPart) {
        throw new Error(`Invalid pokemonKey: ${pokemonKey}`);
    }

    const tokens = variantPart.split('_');

    // Define known forms including mega_x and mega_y
    const knownForms = ['mega', 'mega_x', 'mega_y', 'primal'];

    // Process tokens to set flags and names
    let i = 0;
    while (i < tokens.length) {
        let token = tokens[i];

        if (token === 'shiny') {
            isShiny = true;
            i++;
        } else if (token === 'shadow') {
            isShadow = true;
            i++;
        } else if (token === 'default') {
            // 'default' doesn't change any flags
            i++;
        } else {
            // Check if the remaining tokens form a known form
            const remainingTokens = tokens.slice(i).join('_').toLowerCase();
            if (knownForms.includes(remainingTokens)) {
                formName = remainingTokens;
                break; // No more tokens to process
            } else {
                // Assume it's part of a costume name
                if (costumeName) {
                    costumeName += `_${token}`;
                } else {
                    costumeName = token;
                }
                i++;
            }
        }
    }

    // Get the Pokémon data for this pokemon_id
    const pokemon = pokemonData.find(p => p.pokemon_id === pokemon_id);

    if (!pokemon) {
        console.warn(`Could not find pokemon with id ${pokemon_id}`);
        return null; // Return null to indicate failure
    }

    // If there is a costumeName, find the costume_id
    let costumeId = null;
    if (costumeName) {
        // Ensure pokemon.costumes is an array
        if (Array.isArray(pokemon.costumes)) {
            // Since costume names in the data might have underscores, we need to replace them with spaces or match accordingly
            const costume = pokemon.costumes.find(
                c =>
                    c.name &&
                    c.name.replace(/ /g, '_').toLowerCase() === costumeName.toLowerCase()
            );
            if (costume) {
                costumeId = costume.costume_id;
            } else {
                console.warn(
                    `Could not find costume with name '${costumeName}' for pokemon id ${pokemon_id}`
                );
                return null;
            }
        } else {
            console.warn(`No costumes available for pokemon id ${pokemon_id}`);
            return null;
        }
    }

    // Handle forms (mega and primal)
    let form = null;
    if (formName) {
        form = formName;

        if (formName.startsWith('mega')) {
            // For mega forms
            if (pokemon.megaEvolutions && pokemon.megaEvolutions.length > 0) {
                if (formName === 'mega') {
                    // Mega evolution exists; accept it
                    // No further validation needed
                } else {
                    // For mega_x and mega_y
                    const matchingMega = pokemon.megaEvolutions.find(mega => {
                        return (
                            mega.form &&
                            mega.form.replace(/ /g, '_').toLowerCase() === formName.toLowerCase()
                        );
                    });
                    if (!matchingMega) {
                        console.warn(
                            `Warning: Mega form '${formName}' not found for pokemon id ${pokemon_id}`
                        );
                        // You might want to handle this differently, e.g., throw an error or set form to null
                    }
                }
            } else {
                console.warn(
                    `Warning: No mega evolutions available for pokemon id ${pokemon_id}`
                );
                // You might want to handle this differently, e.g., throw an error or set form to null
            }
        } else if (formName === 'primal') {
            // Handle primal forms if applicable
            if (pokemon.primalEvolutions && pokemon.primalEvolutions.length > 0) {
                // Primal evolution exists; accept it
            } else {
                console.warn(
                    `Warning: No primal evolutions available for pokemon id ${pokemon_id}`
                );
                // You might want to handle this differently
            }
        } else {
            // Handle other forms
            if (Array.isArray(pokemon.forms) && pokemon.forms.length > 0) {
                const formExists = pokemon.forms.some(
                    f =>
                        f.name &&
                        f.name.replace(/ /g, '_').toLowerCase() === formName.toLowerCase()
                );
                if (!formExists) {
                    console.warn(
                        `Warning: Form '${formName}' not found for pokemon id ${pokemon_id}`
                    );
                    // You might want to handle this differently
                }
            } else {
                console.warn(
                    `Warning: No valid forms found for pokemon id ${pokemon_id}`
                );
            }
        }
    }

    // Get gender_rate from pokemon
    const genderRate = pokemon.gender_rate;

    // Get moves from pokemon
    const moves = pokemon.moves || [];

    const name = pokemon.name;

    return { pokemon_id, isShiny, isShadow, costumeId, form, genderRate, moves, name };
}

// Helper function to generate a Pokémon instance for a user
function generatePokemonInstance(pokemonKey, userId) {
    try {
        console.log(`Generating Pokémon instance for user ID: ${userId} and Pokémon key: ${pokemonKey}`);

        // Parse the pokemonKey to get details
        const parsedData = parsePokemonKey(pokemonKey);

        if (!parsedData) {
            console.warn(`Failed to parse Pokémon key: ${pokemonKey}`);
            return null; // Return null to indicate failure
        }

        const { pokemon_id, isShiny, isShadow, costumeId, form, genderRate, moves, name } = parsedData;

        // Determine gender
        let gender = 'genderless';

        if (genderRate && !genderRate.includes('GL')) {
            let maleRate = 0;
            let femaleRate = 0;
            const rates = genderRate.split('_');
            rates.forEach(rate => {
                if (rate.endsWith('M')) {
                    maleRate = parseInt(rate.replace('M', ''), 10);
                } else if (rate.endsWith('F')) {
                    femaleRate = parseInt(rate.replace('F', ''), 10);
                }
            });
            const totalRate = maleRate + femaleRate;
            const randomValue = faker.number.int({ min: 0, max: totalRate - 1 });

            if (randomValue < maleRate) {
                gender = 'male';
            } else {
                gender = 'female';
            }
        }

        // Select moves
        const fastMoves = moves.filter(move => move.is_fast);
        const chargedMoves = moves.filter(move => !move.is_fast);

        // Check if moves are available
        let fastMove = null;
        let selectedChargedMoves = [];

        if (fastMoves.length > 0) {
            fastMove = faker.helpers.arrayElement(fastMoves);
        } else {
            console.warn(`Warning: No fast moves available for Pokémon ID ${pokemon_id} (${name}). Setting fast_move_id to null.`);
        }

        if (chargedMoves.length > 0) {
            selectedChargedMoves = faker.helpers.arrayElements(chargedMoves, 2);
        } else {
            console.warn(`Warning: No charged moves available for Pokémon ID ${pokemon_id} (${name}). Setting charged_move1_id and charged_move2_id to null.`);
        }

        // Handle trade/wanted status. Shadow and mega/primal Pokémon can only be owned.
        let isForTrade = 0;
        let isWanted = 0;
        let isOwned = 1;
        let isUnowned = 0;
        let registered = 0;

        if (isShadow || form) {
            // Shadows and mega/primal forms can only be owned, not for trade or wanted
            isForTrade = 0;
            isWanted = 0;
            isOwned = 1;
            registered = 1;
        } else {
            // For non-shadow and non-form Pokémon, determine trade or wanted status
            const tradeOrWantedRoll = faker.number.int({ min: 1, max: 100 });

            if (tradeOrWantedRoll <= 40) {
                // 40% chance to be "for trade"
                isForTrade = 1;
                registered = 1; // If it's for trade, it must be registered and owned
                isOwned = 1;
            } else if (tradeOrWantedRoll > 40 && tradeOrWantedRoll <= 70) {
                // 30% chance to be "wanted"
                isWanted = 1;
                isOwned = faker.datatype.boolean() ? 1 : 0; // Wanted Pokémon can be owned or unowned
                isUnowned = isOwned === 0 ? 1 : 0;
            } else {
                // 30% chance to be owned only
                isOwned = 1;
                registered = 1;
            }
        }

        // If the Pokémon is owned or for trade, it must be registered
        if (isOwned || isForTrade) {
            registered = 1;
        }

        const instance = {
            instance_id: `${pokemonKey}_${faker.string.uuid()}`, // Generate instance_id based on pokemonKey and UUID
            pokemon_id: pokemon_id,
            shiny: isShiny,
            shadow: isShadow,
            costume_id: costumeId,
            form: form, // Include form in the instance
            fast_move_id: fastMove ? fastMove.move_id : null,
            charged_move1_id: selectedChargedMoves[0] ? selectedChargedMoves[0].move_id : null,
            charged_move2_id: selectedChargedMoves[1] ? selectedChargedMoves[1].move_id : null,
            gender: gender,
            is_unowned: isUnowned,
            is_owned: isOwned,
            is_for_trade: isForTrade,
            is_wanted: isWanted,
            registered: registered,
            user_id: userId,
            not_trade_list: '{}', // Default empty
            not_wanted_list: '{}', // Default empty
            date_added: new Date(),
            last_update: Date.now()
        };

        return instance;
    } catch (error) {
        console.warn(`Error generating Pokémon instance for key ${pokemonKey}: ${error.message}`);
        return null;
    }
}

// Function to update the not_wanted_list and not_trade_list
function updateTradeAndWantedLists(wantedInstances, tradeInstances) {
    tradeInstances.forEach(tradeInstance => {
        const notWantedCount = faker.number.int({ min: 1, max: Math.min(5, wantedInstances.length) });
        const notWantedSelection = faker.helpers.arrayElements(wantedInstances, notWantedCount);
        tradeInstance.not_wanted_list = JSON.stringify(
            notWantedSelection.reduce((acc, wanted) => ({ ...acc, [wanted.instance_id]: true }), {})
        );
    });

    wantedInstances.forEach(wantedInstance => {
        const notTradeCount = faker.number.int({ min: 1, max: Math.min(5, tradeInstances.length) });
        const notTradeSelection = faker.helpers.arrayElements(tradeInstances, notTradeCount);
        wantedInstance.not_trade_list = JSON.stringify(
            notTradeSelection.reduce((acc, trade) => ({ ...acc, [trade.instance_id]: true }), {})
        );
    });
}

module.exports = {
    getRandomVancouverCoordinates,
    getRandomPokemonKey,
    generatePokemonInstance,
    updateTradeAndWantedLists
};