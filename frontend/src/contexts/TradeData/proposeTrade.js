// proposeTrade.js

import {
    TRADE_FRIENDSHIP_LEVELS,
    TRADE_STATUSES,
    getTradeByPokemonPair 
  } from '../../services/indexedDB';
  import { generateUUID } from '../../utils/PokemonIDUtils';
  
export async function proposeTrade(tradeData) {
    // Destructure and validate required fields
    const {
        username_proposed,
        username_accepting,
        pokemon_instance_id_user_proposed,
        pokemon_instance_id_user_accepting = null,
        is_special_trade = false,
        is_registered_trade = false,
        trade_dust_cost = 0,
        is_lucky_trade = false,
        trade_friendship_level = 1,
        pokemon,
    } = tradeData;

    if (!username_proposed || typeof username_proposed !== 'string') {
        throw new Error('Invalid or missing "username_proposed".');
    }

    if (!username_accepting || typeof username_accepting !== 'string') {
        throw new Error('Invalid or missing "username_accepting".');
    }

    if (!pokemon_instance_id_user_proposed || typeof pokemon_instance_id_user_proposed !== 'string') {
        throw new Error('Invalid or missing "pokemon_instance_id_user_proposed".');
    }

    if (pokemon_instance_id_user_accepting && typeof pokemon_instance_id_user_accepting !== 'string') {
        throw new Error('"pokemon_instance_id_user_accepting" must be a string or null.');
    }

    if (![1, 2, 3, 4].includes(trade_friendship_level)) {
        throw new Error('"trade_friendship_level" must be an integer between 1 and 4.');
    }

    if (!pokemon || typeof pokemon !== 'object') {
        throw new Error('Invalid or missing "pokemon" data.');
    }

    // Check for duplicate trade using the new helper without indexes
    if (pokemon_instance_id_user_accepting) {
        const existingTrade = await getTradeByPokemonPair(
        pokemon_instance_id_user_proposed,
        pokemon_instance_id_user_accepting
        );
        if (existingTrade) {
        throw new Error('This trade proposal already exists.');
        }
    }

    // Generate trade ID
    const trade_id = `trade_${generateUUID()}`;

    // Prepare the trade data
    const tradeEntry = {
        trade_id,
        username_proposed,
        username_accepting,
        pokemon_instance_id_user_proposed,
        pokemon_instance_id_user_accepting,
        is_special_trade: is_special_trade ? 1 : 0,
        is_registered_trade: is_registered_trade ? 1 : 0,
        is_lucky_trade: is_lucky_trade ? 1 : 0,
        trade_dust_cost,
        trade_friendship_level: TRADE_FRIENDSHIP_LEVELS[trade_friendship_level],
        user_1_trade_satisfaction: null,
        user_2_trade_satisfaction: null,
        trade_status: TRADE_STATUSES.PROPOSED,
        trade_accepted_date: null,
        trade_proposal_date: new Date().toISOString(),
        trade_completed_date: null,
        trade_cancelled_date: null,
        trade_cancelled_by: null,
        last_update: Date.now(),
    };

    // Prepare related instance data
    const relatedInstanceData = {
        instance_id: pokemon.pokemonKey,
        ...pokemon.ownershipStatus,
    };

    return {
        tradeEntry,
        relatedInstanceData
    };
}