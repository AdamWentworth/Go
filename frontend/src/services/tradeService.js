// src/services/tradeService.js

import { createTrade, TRADE_FRIENDSHIP_LEVELS, TRADE_STATUSES, addRelatedInstance } from './indexedDB';
import { generateUUID } from '../utils/PokemonIDUtils';

/**
 * Proposes a new trade by creating a trade entry in IndexedDB.
 *
 * @param {Object} tradeData - The data required to propose a trade.
 * @param {string} tradeData.username_proposed - Username of the user proposing the trade.
 * @param {string} tradeData.username_accepting - Username of the user receiving the trade proposal.
 * @param {string} tradeData.pokemon_instance_id_user_proposed - Instance ID of the user's Pokémon being offered.
 * @param {string|null} tradeData.pokemon_instance_id_user_accepting - Instance ID of the user's Pokémon being requested (optional).
 * @param {boolean} tradeData.is_special_trade - Indicates if the trade is special.
 * @param {boolean} tradeData.is_registered_trade - Indicates if the trade is registered.
 * @param {number} tradeData.trade_dust_cost - Stardust cost of the trade.
 * @param {boolean} tradeData.is_lucky_trade - Indicates if the trade is lucky.
 * @param {number} tradeData.trade_friendship_level - Friendship level (1-4).
 *
 * @returns {Promise<number>} - Returns a promise that resolves to the trade ID.
 *
 * @throws {Error} - Throws an error if trade creation fails or data is invalid.
 */
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
        trade_friendship_level = 1, // Default to 'Good'
        pokemon,
    } = tradeData;

    // Basic Validation
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

    // Generate a unique trade_id with "trade_" prefix
    const trade_id = `trade_${generateUUID()}`;

    // Prepare the trade data for IndexedDB
    const tradeEntry = {
        trade_id,
        username_proposed,
        username_accepting,
        pokemon_instance_id_user_proposed,
        pokemon_instance_id_user_accepting,
        trade_status: TRADE_STATUSES.PROPOSED, // Using TRADE_STATUSES.PROPOSED if imported
        trade_proposal_date: new Date().toISOString(), // ISO 8601 format
        trade_accepted_date: null,
        trade_completed_date: null,
        trade_cancelled_date: null,
        trade_cancelled_by: null,
        is_special_trade: is_special_trade ? 1 : 0,
        is_registered_trade: is_registered_trade ? 1 : 0,
        trade_dust_cost,
        is_lucky_trade: is_lucky_trade ? 1 : 0,
        trade_friendship_level: TRADE_FRIENDSHIP_LEVELS[trade_friendship_level], // Map to string
        user_1_trade_satisfaction: null,
        user_2_trade_satisfaction: null,
    };    

    console.log(tradeEntry.trade_proposal_date);

    try {
        // Create the trade
        const tradeId = await createTrade(tradeEntry);
        
        // Prepare Pokémon instance data
        const relatedInstanceData = {
            instance_id: pokemon.pokemonKey, // Using pokemonKey as instance_id
            ...pokemon, // Spread all other Pokémon data
            // Optionally, add more fields if necessary
        };

        // Add the related Pokémon instance
        await addRelatedInstance(relatedInstanceData, tradeId);

        return tradeId;
    } catch (error) {
        console.error('Failed to propose trade:', error);
        throw new Error('Trade proposal failed.');
    }
}