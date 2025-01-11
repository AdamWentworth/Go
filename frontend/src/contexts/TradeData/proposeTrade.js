// proposeTrade.js

import {
    createTrade,
    TRADE_FRIENDSHIP_LEVELS,
    TRADE_STATUSES,
    addRelatedInstance,
    putBatchedTradeUpdates,
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

    // Generate a unique trade_id with "trade_" prefix
    const trade_id = `trade_${generateUUID()}`;

    // Prepare the trade data for IndexedDB
    const tradeEntry = {
        trade_id,
        username_proposed,
        username_accepting,
        pokemon_instance_id_user_proposed,
        pokemon_instance_id_user_accepting,
        trade_status: TRADE_STATUSES.PROPOSED,
        trade_proposal_date: new Date().toISOString(),
        trade_accepted_date: null,
        trade_completed_date: null,
        trade_cancelled_date: null,
        trade_cancelled_by: null,
        is_special_trade: is_special_trade ? 1 : 0,
        is_registered_trade: is_registered_trade ? 1 : 0,
        trade_dust_cost,
        is_lucky_trade: is_lucky_trade ? 1 : 0,
        trade_friendship_level: TRADE_FRIENDSHIP_LEVELS[trade_friendship_level],
        user_1_trade_satisfaction: null,
        user_2_trade_satisfaction: null,
        last_update: Date.now(),
    };

    try {
        // 1. Create the trade in the tradesDB
        const tradeId = await createTrade(tradeEntry);

        // 2. Add related Pokémon instance
        const relatedInstanceData = {
            instance_id: pokemon.pokemonKey,
            ...pokemon.ownershipStatus,
        };
        const relatedInstance = await addRelatedInstance(relatedInstanceData, tradeId);

        // 3. Also cache this trade creation in batchedUpdatesDB (batchedTradeUpdates)
        const batchedUpdateData = {
            operation: 'createTrade',
            tradeData: tradeEntry,
        };
        // Use the same trade_id as the key so you can uniquely identify it later
        await putBatchedTradeUpdates(tradeEntry.trade_id, batchedUpdateData);

        return { tradeId, relatedInstance };
    } catch (error) {
        console.error('Failed to propose trade:', error);
        throw new Error('Trade proposal failed.');
    }
}
