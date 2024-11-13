// fetchData.js

import { getPokemons } from '../../services/api';
import createPokemonVariants from '../../services/createPokemonVariants';
import { preloadImage } from '../../utils/imageHelpers';
import { determinePokemonKey } from '../../services/determinePokemonKey';
import { isDataFresh } from '../../utils/cacheHelpers';
import { formatTimeAgo } from '../../utils/formattingHelpers';
import { initializePokemonLists } from '../../features/Collect/PokemonOwnership/PokemonTradeListOperations';
import {
    initializeOrUpdateOwnershipDataAsync,
} from '../../features/Collect/PokemonOwnership/pokemonOwnershipStorage';
import {
    putIntoDB,
    getAllFromDB,
    getMetadata,
    updateMetadata,
    getListFromDB,
    storeListsInIndexedDB
} from '../../services/indexedDBConfig';

export const fetchData = async (setData, updateOwnership, updateLists) => {
    console.log("Fetching data from API or cache...");
    const pokemonDataCacheKey = "pokemonData"; // LocalStorage key for Pokémon data
    const variantsStoreName = "pokemonVariants"; // IndexedDB store for Pokémon variants
    const ownershipDataCacheKey = "pokemonOwnership";
    const cacheStorageName = 'pokemonCache';

    // Open the cache storage
    const cacheStorage = await caches.open(cacheStorageName);

    // Try to retrieve the cached ownership data
    const cachedOwnershipResponse = await cacheStorage.match(ownershipDataCacheKey);

    let variants, ownershipData, lists;

    // Deserialize responses if available
    const cachedOwnership = cachedOwnershipResponse ? await cachedOwnershipResponse.json() : null;

    // Retrieve variants metadata to check freshness
    const variantsMetadata = await getMetadata('variantsTimestamp');
    const variantsTimestamp = variantsMetadata ? variantsMetadata.timestamp : 0;

    // Retrieve lists metadata to check freshness
    const listsMetadata = await getMetadata('listsTimestamp');
    const listsTimestamp = listsMetadata ? listsMetadata.timestamp : 0;

    // Log cached data freshness and details
    if (variantsTimestamp) {
        console.log(`Cached Variants Age: ${formatTimeAgo(variantsTimestamp)}`);
    } else {
        console.log("Variants data is missing.");
    }

    if (cachedOwnership) {
        console.log(`Cached Ownership Data Age: ${formatTimeAgo(cachedOwnership.timestamp)}`);
    }

    if (listsTimestamp) {
        console.log(`Cached Lists Data Age: ${formatTimeAgo(listsTimestamp)}`);
    } else {
        console.log("Lists data is missing.");
    }

    // Best case scenario - All data is less than 24hrs old
    if (
        variantsTimestamp &&
        cachedOwnership &&
        listsTimestamp &&
        isDataFresh(variantsTimestamp) &&
        isDataFresh(cachedOwnership.timestamp) &&
        isDataFresh(listsTimestamp)
    ) {
        console.log("Using cached variants, ownership data, and lists");

        // Retrieve all variants from IndexedDB
        variants = await getAllFromDB(variantsStoreName);
        variants.sort((a, b) => a.pokemonKey.localeCompare(b.pokemonKey));

        ownershipData = cachedOwnership.data;

        // Retrieve lists from IndexedDB
        lists = {
            owned: await getListFromDB('owned'),
            unowned: await getListFromDB('unowned'),
            wanted: await getListFromDB('wanted'),
            trade: await getListFromDB('trade'),
        };
    } else {
        console.log("Data is stale or missing, updating...");

        // Retrieve Pokémon data from localStorage or fetch from API
        let pokemons;
        const cachedData = localStorage.getItem(pokemonDataCacheKey);
        const pokemonTimestamp = cachedData ? JSON.parse(cachedData).timestamp : 0;

        if (cachedData && isDataFresh(pokemonTimestamp)) {
            console.log("Using Pokémon data from localStorage");
            pokemons = JSON.parse(cachedData).data;
        } else {
            console.log("Fetching new data from API");
            pokemons = await getPokemons();

            // Store Pokémon data in localStorage
            localStorage.setItem(pokemonDataCacheKey, JSON.stringify({
                data: pokemons,
                timestamp: Date.now()
            }));
            console.log("Stored new Pokémon data in localStorage");
        }

        // Process pokemons into variants
        variants = createPokemonVariants(pokemons);
        variants.forEach(variant => {
            variant.pokemonKey = determinePokemonKey(variant);
            preloadImage(variant.currentImage);
            if (variant.type_1_icon) preloadImage(variant.type_1_icon);
            if (variant.type_2_icon) preloadImage(variant.type_2_icon);
        });

        // Store each variant individually in IndexedDB
        for (const variant of variants) {
            try {
                await putIntoDB(variantsStoreName, variant);
            } catch (error) {
                console.error(`Failed to store variant with key ${variant.pokemonKey}:`, error);
            }
        }

        // Update timestamp for variants
        await updateMetadata('variantsTimestamp', Date.now());
        console.log("Stored updated variants in IndexedDB");

        // Initialize or update ownership data
        const keys = variants.map(variant => variant.pokemonKey);
        ownershipData = await initializeOrUpdateOwnershipDataAsync(keys, variants);
        lists = initializePokemonLists(ownershipData, variants);

        // Update cache with new ownership data
        await cacheStorage.put(ownershipDataCacheKey, new Response(JSON.stringify({
            data: ownershipData,
            timestamp: Date.now()
        }), {
            headers: { 'Content-Type': 'application/json' }
        }));

        // Store lists into IndexedDB
        await storeListsInIndexedDB(lists);
        await updateMetadata('listsTimestamp', Date.now());
        console.log("Stored updated lists in IndexedDB");
    }

    // Final data setting
    setData({ variants, ownershipData, lists, loading: false, updateOwnership, updateLists });
};
