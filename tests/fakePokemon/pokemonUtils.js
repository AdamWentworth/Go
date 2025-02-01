// pokemonUtils.js

const { faker } = require('@faker-js/faker');
const fs = require('fs');

const { cpMultipliers, calculateCP } = require('./cpUtils');

// Load Pokémon data and keys from JSON files
const pokemonData = JSON.parse(fs.readFileSync('./pokemon.json', 'utf8'));
const pokemonKeys = JSON.parse(fs.readFileSync('./pokemonKeys.json', 'utf8'));

// Function to get a random Pokémon key, excluding primal, mega, and fusion forms
function getRandomPokemonKey() {
    // Filter out keys containing primal, mega, or fusion
    const filteredKeys = pokemonKeys.filter(key => {
        const lowerKey = key.toLowerCase();
        return !lowerKey.includes('primal') && 
               !lowerKey.includes('mega') && 
               !lowerKey.includes('fusion');
    });
    
    const randomKey = faker.helpers.arrayElement(filteredKeys);
    return randomKey;
}

// Helper function to parse pokemonKey and determine variant details
function parsePokemonKey(pokemonKey) {
    const keyParts = pokemonKey.split('-');
    const pokemon_id = parseInt(keyParts[0], 10);
    const variantPart = keyParts.slice(1).join('-');

    let isShiny = false;
    let isShadow = false;
    let costumeName = null;
    let formName = null;
    let isDynamax = false;
    let isGigantamax = false;

    if (!variantPart) {
        throw new Error(`Invalid pokemonKey: ${pokemonKey}`);
    }

    const tokens = variantPart.split('_');

    // Define known forms - removing primal and mega since we're not using them
    const knownForms = [];  // Emptied since we're excluding mega/primal forms

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
        } else if (token === 'dynamax') {
            isDynamax = true;
            i++;
        } else if (token === 'gigantamax') {
            isGigantamax = true;
            i++;
        } else if (token === 'default') {
            i++;
        } else {
            // Check if the remaining tokens form a known form
            const remainingTokens = tokens.slice(i).join('_').toLowerCase();
            if (knownForms.includes(remainingTokens)) {
                formName = remainingTokens;
                break;
            } else {
                if (costumeName) {
                    costumeName += `_${token}`;
                } else {
                    costumeName = token;
                }
                i++;
            }
        }
    }

    const pokemon = pokemonData.find(p => p.pokemon_id === pokemon_id);

    if (!pokemon) {
        console.warn(`Could not find pokemon with id ${pokemon_id}`);
        return null;
    }

    let costumeId = null;
    if (costumeName) {
        if (Array.isArray(pokemon.costumes)) {
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

    // Handle regular forms (not mega/primal)
    let form = null;
    if (formName) {
        form = formName;
        
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
            }
        } else {
            console.warn(
                `Warning: No valid forms found for pokemon id ${pokemon_id}`
            );
        }
    }

    const genderRate = pokemon.gender_rate;
    const moves = pokemon.moves || [];
    const name = pokemon.name;

    return { 
        pokemon_id, 
        isShiny, 
        isShadow, 
        costumeId, 
        form, 
        genderRate, 
        moves, 
        name,
        isDynamax,
        isGigantamax
    };
}

function generateSizeWithDistribution(baseValue, standardDeviation, xxsThreshold, xsThreshold, xlThreshold, xxlThreshold) {
    // 1 in 5 chance (20%) for XXS or XXL
    const extremeRoll = faker.number.int({ min: 1, max: 100 });
    
    if (extremeRoll <= 10) {
        // XXS: Generate a value below xxsThreshold
        return faker.number.float({
            min: xxsThreshold * 0.7, // Allow some variation below XXS threshold
            max: xxsThreshold,
            precision: 0.01
        });
    } else if (extremeRoll <= 20) {
        // XXL: Generate a value above xxlThreshold
        return faker.number.float({
            min: xxlThreshold,
            max: xxlThreshold * 1.3, // Allow some variation above XXL threshold
            precision: 0.01
        });
    } else {
        // Normal distribution for the remaining 80%
        // Using Box-Muller transform for normal distribution
        const u1 = faker.number.float({ min: 0, max: 1 });
        const u2 = faker.number.float({ min: 0, max: 1 });
        
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        let value = baseValue + z * standardDeviation;
        
        // Clamp the value between XS and XL thresholds
        value = Math.max(xsThreshold, Math.min(xlThreshold, value));
        
        return parseFloat(value.toFixed(2));
    }
}

// Helper function to generate a Pokémon instance for a user
function generatePokemonInstance(pokemonKey, userId) {
    try {
        console.log(`Generating Pokémon instance for user ID: ${userId} and Pokémon key: ${pokemonKey}`);

        const parsedData = parsePokemonKey(pokemonKey);
        if (!parsedData) {
            console.warn(`Failed to parse Pokémon key: ${pokemonKey}`);
            return null;
        }
        
        const { 
            pokemon_id, 
            isShiny, 
            isShadow, 
            costumeId, 
            form, 
            genderRate, 
            moves, 
            name,
            isDynamax,
            isGigantamax
        } = parsedData;
        const pokemon = pokemonData.find((p) => p.pokemon_id === pokemon_id);

        if (!pokemon) {
            console.warn(`Could not find pokemon with id ${pokemon_id}`);
            return null;
        }
        // Extract size data from pokemon.json
        const {
            pokedex_height,
            pokedex_weight,
            height_standard_deviation,
            weight_standard_deviation,
            height_xxs_threshold,
            height_xs_threshold,
            height_xl_threshold,
            height_xxl_threshold,
            weight_xxs_threshold,
            weight_xs_threshold,
            weight_xl_threshold,
            weight_xxl_threshold
        } = pokemon.sizes;

        // Generate height and weight using the new distribution
        const height = generateSizeWithDistribution(
            pokedex_height,
            height_standard_deviation,
            height_xxs_threshold,
            height_xs_threshold,
            height_xl_threshold,
            height_xxl_threshold
        );

        const weight = generateSizeWithDistribution(
            pokedex_weight,
            weight_standard_deviation,
            weight_xxs_threshold,
            weight_xs_threshold,
            weight_xl_threshold,
            weight_xxl_threshold
        );

        // Calculate size categories for logging/verification
        let heightCategory = 'normal';
        if (height <= height_xxs_threshold) heightCategory = 'XXS';
        else if (height <= height_xs_threshold) heightCategory = 'XS';
        else if (height >= height_xxl_threshold) heightCategory = 'XXL';
        else if (height >= height_xl_threshold) heightCategory = 'XL';

        let weightCategory = 'normal';
        if (weight <= weight_xxs_threshold) weightCategory = 'XXS';
        else if (weight <= weight_xs_threshold) weightCategory = 'XS';
        else if (weight >= weight_xxl_threshold) weightCategory = 'XXL';
        else if (weight >= weight_xl_threshold) weightCategory = 'XL';

        console.log(`Generated ${pokemon.name} size - Height: ${height}m (${heightCategory}), Weight: ${weight}kg (${weightCategory})`);


        // ---------------------------
        // 1. Grab the base stats
        //    (Adjust property names as needed based on your JSON structure!)
        // ---------------------------
        const baseAttack = parseInt(pokemon.attack, 10) || 0;
        const baseDefense = parseInt(pokemon.defense, 10) || 0;
        const baseStamina = parseInt(pokemon.stamina, 10) || 0;

        // ---------------------------
        // 2. Randomly generate your level and IVs
        //    (You can do a full random approach or
        //     some other logic if needed.)
        // ---------------------------
        const level = faker.number.int({ min: 1, max: 50 }); // or go up to 51, or allow half levels
        const generateValidIV = () => {
            const iv = faker.number.int({ min: 0, max: 15 });
            return Number.isInteger(iv) ? iv : 0; // Fallback to 0 if not a valid integer
        };
        
        const ivAttack = generateValidIV();
        const ivDefense = generateValidIV();
        const ivStamina = generateValidIV();

        // ---------------------------
        // 3. Calculate CP
        // ---------------------------
        const multiplier = cpMultipliers[level];
        let cp = 0; // Default to 0 instead of null

        if (multiplier) {
            cp = calculateCP(
                baseAttack,
                baseDefense,
                baseStamina,
                ivAttack,
                ivDefense,
                ivStamina,
                multiplier
            );
        } else {
            console.warn(`No CP multiplier found for level ${level}. CP set to 0.`);
        }

        // ---------------------------
        // 5. Decide the rest of your fields (moves, ownership, etc.)
        // ---------------------------
        let gender = 'Genderless';

        if (genderRate) {
            let maleRate = 0;
            let femaleRate = 0;
            let genderlessRate = 0;
            const rates = genderRate.split('_');
            rates.forEach((rate) => {
                if (rate.endsWith('M')) {
                    maleRate = parseInt(rate.replace('M', ''), 10) || 0;
                } else if (rate.endsWith('F')) {
                    femaleRate = parseInt(rate.replace('F', ''), 10) || 0;
                } else if (rate.endsWith('GL')) {
                    genderlessRate = parseInt(rate.replace('GL', ''), 10) || 0;
                }
            });
            const totalRate = maleRate + femaleRate + genderlessRate;
            const randomValue = faker.number.int({ min: 1, max: totalRate || 1 }); // Avoid max < min

            if (randomValue <= maleRate) {
                gender = 'Male';
            } else if (randomValue <= maleRate + femaleRate) {
                gender = 'Female';
            } else {
                gender = 'Genderless';
            }
        }

        const fastMoves = moves.filter((move) => move.is_fast);
        const chargedMoves = moves.filter((move) => !move.is_fast);

        let fastMove = null;
        let selectedChargedMoves = [];

        if (fastMoves.length > 0) {
            fastMove = faker.helpers.arrayElement(fastMoves);
        } else {
            console.warn(`No fast moves available for Pokémon ID ${pokemon_id} (${name}). Setting to 0.`);
        }

        if (chargedMoves.length > 0) {
            selectedChargedMoves = faker.helpers.arrayElements(chargedMoves, Math.min(2, chargedMoves.length));
        } else {
            console.warn(`No charged moves available for Pokémon ID ${pokemon_id} (${name}). Setting to 0.`);
        }

        let isForTrade = 0;
        let isWanted = 0;
        let isOwned = 1;
        let isUnowned = 0;
        let registered = 0;

        if (isShadow || form) {
            isForTrade = 0;
            isWanted = 0;
            isOwned = 1;
            registered = 1;
        } else {
            const tradeOrWantedRoll = faker.number.int({ min: 1, max: 100 });
            if (tradeOrWantedRoll <= 40) {
                isForTrade = 1;
                registered = 1;
                isOwned = 1;
            } else if (tradeOrWantedRoll > 40 && tradeOrWantedRoll <= 70) {
                isWanted = 1;
                isOwned = faker.datatype.boolean() ? 1 : 0;
                isUnowned = isOwned === 0 ? 1 : 0;
            } else {
                isOwned = 1;
                registered = 1;
            }
        }

        if (isOwned || isForTrade) {
            registered = 1;
        }

        let friendship_level = 0; // Default to 0 instead of null
        let pref_lucky = 0;

        if (isWanted === 1) {
            const friendshipLevels = [0, 1, 2, 3, 4];
            friendship_level = faker.helpers.arrayElement(friendshipLevels);
            if (friendship_level === 4) {
                pref_lucky = faker.datatype.boolean() ? 1 : 0;
            }
        }

        // ---------------------------
        // 6. Enforce Mutual Exclusivity for Dynamax and Gigantamax
        // ---------------------------
        // A Pokémon cannot be both Dynamax and Gigantamax
        let dynamax = 0;
        let gigantamax = 0;

        if (isGigantamax) {
            gigantamax = 1;
            dynamax = 0; // Ensure it's not both
        } else if (isDynamax) {
            dynamax = 1;
            gigantamax = 0;
        }

        // ---------------------------
        // 7. Finally, build the Pokémon instance object
        // ---------------------------
        const instance = {
            instance_id: `${pokemonKey}_${faker.string.uuid()}`,
            pokemon_id,
            shiny: isShiny ? 1 : 0,
            shadow: isShadow ? 1 : 0,
            costume_id: costumeId || 0,
            form: form || 'default',
            fast_move_id: fastMove ? fastMove.move_id : 0,
            charged_move1_id: selectedChargedMoves[0] ? selectedChargedMoves[0].move_id : 0,
            charged_move2_id: selectedChargedMoves[1] ? selectedChargedMoves[1].move_id : 0,
            gender,
            is_unowned: isUnowned || 0,
            is_owned: isOwned || 0,
            is_for_trade: isForTrade || 0,
            is_wanted: isWanted || 0,
            registered: registered || 0,
            user_id: userId,
            not_trade_list: '{}', 
            not_wanted_list: '{}',
            date_added: new Date(),
            last_update: Date.now(),
            friendship_level,
            pref_lucky,

            // ---------------------------
            // New CP-related fields
            // ---------------------------
            level: level || 1,
            cp: cp || 0,  // in case no multiplier was found

            attack_iv: Number.isInteger(ivAttack) ? ivAttack : 0,
            defense_iv: Number.isInteger(ivDefense) ? ivDefense : 0,
            stamina_iv: Number.isInteger(ivStamina) ? ivStamina : 0,

            // ---------------------------
            // New Weight and Height fields
            // ---------------------------
            weight: parseFloat(weight.toFixed(1)),
            height: parseFloat(height.toFixed(2)),

            // ---------------------------
            // New Dynamax and Gigantamax flags
            // ---------------------------
            dynamax,
            gigantamax,
            mega: 0
        };

        // Validate IV fields before returning
        return validatePokemonInstance(instance);
    } catch (error) {
        console.warn(`Error generating Pokémon instance for key ${pokemonKey}: ${error.message}`);
        return null;
    }
}

// Function to validate IV fields
function validatePokemonInstance(instance) {
    const ivFields = ['attack_iv', 'defense_iv', 'stamina_iv'];
    ivFields.forEach(field => {
        if (typeof instance[field] !== 'number' || isNaN(instance[field])) {
            console.warn(`Invalid value for ${field}: ${instance[field]}. Setting to 0.`);
            instance[field] = 0;
        }
    });
    return instance;
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
    getRandomPokemonKey,
    generatePokemonInstance,
    updateTradeAndWantedLists
};
