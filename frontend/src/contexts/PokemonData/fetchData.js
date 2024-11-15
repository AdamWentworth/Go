// fetchData.js

import { getPokemons } from '../../services/api';
import createPokemonVariants from '../../services/createPokemonVariants';
import { preloadImage } from '../../utils/imageHelpers';
import { determinePokemonKey } from '../../services/determinePokemonKey';
import { isDataFresh } from '../../utils/cacheHelpers';
import { formatTimeAgo } from '../../utils/formattingHelpers';
import { initializePokemonLists } from '../../features/Collect/PokemonOwnership/PokemonTradeListOperations';
import {
    getAllFromDB,
    getMetadata,
    updateMetadata,
    getListFromDB,
    storeListsInIndexedDB,
    putIntoDB
} from '../../services/indexedDB';
import {
    initializeOrUpdateOwnershipDataAsync, getOwnershipDataAsync, setOwnershipDataAsync
} from '../../features/Collect/PokemonOwnership/pokemonOwnershipStorage';

export const fetchData = async (setData, updateOwnership, updateLists) => {
    console.log("Fetching data from API or cache...");

    let variants, ownershipData, lists;

    // Retrieve ownershipData, variants and lists metadata to check freshness
    const ownershipMetadata = await getMetadata('ownershipTimestamp');
    const ownershipTimestamp = ownershipMetadata ? ownershipMetadata.timestamp : 0;
    const variantsMetadata = await getMetadata('variantsTimestamp');
    const variantsTimestamp = variantsMetadata ? variantsMetadata.timestamp : 0;
    const listsMetadata = await getMetadata('listsTimestamp');
    const listsTimestamp = listsMetadata ? listsMetadata.timestamp : 0;

    // Retrieve ownershipData from IndexedDB
    const { data: ownershipDataData, timestamp: ownershipDataTimestamp } = await getOwnershipDataAsync();
    const cachedOwnership = ownershipDataTimestamp ? { data: ownershipDataData, timestamp: ownershipDataTimestamp } : null;

    // Log cached data freshness and details
    if (variantsTimestamp) {
        console.log(`Cached Variants Age: ${formatTimeAgo(variantsTimestamp)}`);
    } else {
        console.log("Variants data is missing.");
    }

    if (ownershipTimestamp) {
        console.log(`Cached Ownership Data Age: ${formatTimeAgo(ownershipTimestamp)}`);
    } else {
        console.log("Ownership data is missing.");
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
        isDataFresh(ownershipTimestamp) &&
        isDataFresh(listsTimestamp)
    ) {
        console.log("Using cached variants, ownership data, and lists");

        // Retrieve all variants from IndexedDB
        variants = await getAllFromDB('pokemonVariants');
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
        const cachedData = localStorage.getItem('pokemonData');
        const pokemonTimestamp = cachedData ? JSON.parse(cachedData).timestamp : 0;

        if (cachedData && isDataFresh(pokemonTimestamp)) {
            console.log("Using Pokémon data from localStorage");
            pokemons = JSON.parse(cachedData).data;
        } else {
            console.log("Fetching new data from API");
            pokemons = await getPokemons();

            // Store Pokémon data in localStorage
            localStorage.setItem('pokemonData', JSON.stringify({
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
                await putIntoDB('pokemonVariants', variant);
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

        // Save updated ownershipData to IndexedDB
        await setOwnershipDataAsync({ data: ownershipData, timestamp: Date.now() });
        // Update timestamp for ownershipData
        await updateMetadata('ownershipTimestamp', Date.now());
        console.log("Stored updated ownership data in IndexedDB");

        // Store lists into IndexedDB
        await storeListsInIndexedDB(lists);
        await updateMetadata('listsTimestamp', Date.now());
        console.log("Stored updated lists in IndexedDB");
    }

    // Final data setting
    setData({ variants, ownershipData, lists, loading: false, updateOwnership, updateLists });
};