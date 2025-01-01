// fetchData.js

import { getPokemons } from '../../services/api';
import createPokemonVariants from './createPokemonVariants';
import { preloadImage } from '../../utils/imageHelpers';
import { determinePokemonKey } from '../../utils/PokemonIDUtils';
import { isDataFresh } from '../../utils/cacheHelpers';
import { formatTimeAgo } from '../../utils/formattingHelpers';
import { initializePokemonLists } from '../../features/Collect/PokemonOwnership/PokemonTradeListOperations';
import {
    getAllFromDB,
    getAllListsFromDB,
    storeListsInIndexedDB,
    putBulkIntoDB
} from '../../services/indexedDB';
import {
    initializeOrUpdateOwnershipDataAsync, getOwnershipDataAsync
} from './pokemonOwnershipStorage';

export const fetchData = async (setData, updateOwnership, updateLists) => {
    console.log("Fetching data from API or cache...");

    let variants, ownershipData, lists;

    // Retrieve timestamps from localStorage
    const ownershipTimestamp = parseInt(localStorage.getItem('ownershipTimestamp'), 10) || 0;
    const variantsTimestamp = parseInt(localStorage.getItem('variantsTimestamp'), 10) || 0;
    const listsTimestamp = parseInt(localStorage.getItem('listsTimestamp'), 10) || 0;

    // Check data freshness
    const variantsFresh = variantsTimestamp && isDataFresh(variantsTimestamp);
    const ownershipFresh = ownershipTimestamp && isDataFresh(ownershipTimestamp);
    const listsFresh = listsTimestamp && isDataFresh(listsTimestamp);

    let variantsUpdated = false;
    let ownershipUpdated = false;

    // Retrieve ownershipData from IndexedDB
    const { data: ownershipDataData } = await getOwnershipDataAsync();
    const cachedOwnership = ownershipDataData || null;

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

    if (variantsFresh && ownershipFresh && listsFresh) {
        console.log("Using cached variants, ownership data, and lists");

        // Retrieve all variants from IndexedDB
        const startVariantsRetrieval = Date.now();
        variants = await getAllFromDB('pokemonVariants');
        // No need to sort as variants are already stored sorted
        const endVariantsRetrieval = Date.now();
        console.log(`Retrieved variants from IndexedDB in ${(endVariantsRetrieval - startVariantsRetrieval)} ms`);

        ownershipData = cachedOwnership;

        // Retrieve lists from IndexedDB in parallel using a single transaction
        const startListsRetrieval = Date.now();
        lists = await getAllListsFromDB();
        const endListsRetrieval = Date.now();
        console.log(`Retrieved lists from IndexedDB in ${(endListsRetrieval - startListsRetrieval)} ms`);
    } else {
        console.log("Data is stale or missing, updating...");

        // Handle variants
        if (!variantsFresh) {
            console.log("Variants are stale or missing, updating...");
            variants = await fetchAndProcessVariants();
            variantsUpdated = true;
        } else {
            const startVariantsRetrieval = Date.now();
            variants = await getAllFromDB('pokemonVariants');
            // No need to sort as variants are already stored sorted
            const endVariantsRetrieval = Date.now();
            console.log(`Retrieved variants from IndexedDB in ${(endVariantsRetrieval - startVariantsRetrieval)} ms`);
        }

        if (!ownershipFresh || variantsUpdated) {
            console.log("Ownership data is stale or variants updated, updating ownership data...");
            const keys = variants.map(variant => variant.pokemonKey);
            ownershipData = await initializeOrUpdateOwnershipDataAsync(keys, variants);
            ownershipUpdated = true;
        } else {
            ownershipData = cachedOwnership;
        }

        // Handle lists
        if (!listsFresh || ownershipUpdated || variantsUpdated) {
            console.log("Lists are stale or ownership data/variants updated, updating lists...");
            lists = initializePokemonLists(ownershipData, variants);

            // Store lists into IndexedDB
            const startStoreLists = Date.now();
            await storeListsInIndexedDB(lists);
            localStorage.setItem('listsTimestamp', Date.now().toString());
            const endStoreLists = Date.now();
            console.log(`Stored updated lists in IndexedDB in ${(endStoreLists - startStoreLists)} ms`);
        } else {
            const startListsRetrieval = Date.now();
            lists = await getAllListsFromDB();
            const endListsRetrieval = Date.now();
            console.log(`Retrieved lists from IndexedDB in ${(endListsRetrieval - startListsRetrieval)} ms`);
        }
    }

    // Final data setting
    setData({ variants, ownershipData, lists, loading: false, updateOwnership, updateLists });
};

async function fetchAndProcessVariants() {
    // Retrieve Pokémon data from localStorage or fetch from API
    let pokemons;
    const cachedData = localStorage.getItem('pokemonData');
    const pokemonTimestamp = cachedData ? JSON.parse(cachedData).timestamp : 0;

    if (cachedData && isDataFresh(pokemonTimestamp)) {
        console.log("Using Pokémon data from localStorage");
        pokemons = JSON.parse(cachedData).data;
    } else {
        console.log("Fetching new data from API");
        const startFetchPokemons = Date.now();
        pokemons = await getPokemons();
        const endFetchPokemons = Date.now();
        console.log(`Fetched new Pokémon data from API in ${(endFetchPokemons - startFetchPokemons)} ms`);

        // Store Pokémon data in localStorage
        const startStorePokemons = Date.now();
        localStorage.setItem('pokemonData', JSON.stringify({
            data: pokemons,
            timestamp: Date.now()
        }));
        const endStorePokemons = Date.now();
        console.log(`Stored new Pokémon data in localStorage in ${(endStorePokemons - startStorePokemons)} ms`);
    }

    // Process pokemons into variants
    const startProcessVariants = Date.now();
    let variants = createPokemonVariants(pokemons);
    variants.forEach(variant => {
        variant.pokemonKey = determinePokemonKey(variant);
        preloadImage(variant.currentImage);
        if (variant.type_1_icon) preloadImage(variant.type_1_icon);
        if (variant.type_2_icon) preloadImage(variant.type_2_icon);
    });
    const endProcessVariants = Date.now();
    console.log(`Processed Pokémon into variants in ${(endProcessVariants - startProcessVariants)} ms`);

    // Store all variants in IndexedDB using a single transaction
    const startStoreVariants = Date.now();
    try {
        await putBulkIntoDB('pokemonVariants', variants);
    } catch (error) {
        console.error('Failed to store variants in IndexedDB:', error);
    }
    const endStoreVariants = Date.now();
    console.log(`Stored variants in IndexedDB in ${(endStoreVariants - startStoreVariants)} ms`);

    // Update timestamp for variants in localStorage
    localStorage.setItem('variantsTimestamp', Date.now().toString());
    console.log("Stored updated variants in IndexedDB");

    return variants;
}