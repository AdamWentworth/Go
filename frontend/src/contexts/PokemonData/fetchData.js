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
    getListFromDB,
    storeListsInIndexedDB,
    putBulkIntoDB
} from '../../services/indexedDB';
import {
    initializeOrUpdateOwnershipDataAsync, getOwnershipDataAsync, setOwnershipDataAsync
} from '../../features/Collect/PokemonOwnership/pokemonOwnershipStorage';

export const fetchData = async (setData, updateOwnership, updateLists) => {
    console.log("Fetching data from API or cache...");

    let variants, ownershipData, lists;

    // Retrieve timestamps from localStorage
    const ownershipTimestamp = parseInt(localStorage.getItem('ownershipTimestamp'), 10) || 0;
    const variantsTimestamp = parseInt(localStorage.getItem('variantsTimestamp'), 10) || 0;
    const listsTimestamp = parseInt(localStorage.getItem('listsTimestamp'), 10) || 0;

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
        const startVariantsRetrieval = Date.now();
        variants = await getAllFromDB('pokemonVariants');
        variants.sort((a, b) => a.pokemonKey.localeCompare(b.pokemonKey));
        const endVariantsRetrieval = Date.now();
        console.log(`Retrieved variants from IndexedDB in ${(endVariantsRetrieval - startVariantsRetrieval)} ms`);

        ownershipData = cachedOwnership.data;

        // Retrieve lists from IndexedDB
        const startListsRetrieval = Date.now();
        lists = {
            owned: await getListFromDB('owned'),
            unowned: await getListFromDB('unowned'),
            wanted: await getListFromDB('wanted'),
            trade: await getListFromDB('trade'),
        };
        const endListsRetrieval = Date.now();
        console.log(`Retrieved lists from IndexedDB in ${(endListsRetrieval - startListsRetrieval)} ms`);
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
        variants = createPokemonVariants(pokemons);
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

        // Initialize or update ownership data
        const startOwnershipUpdate = Date.now();
        const keys = variants.map(variant => variant.pokemonKey);
        ownershipData = await initializeOrUpdateOwnershipDataAsync(keys, variants);
        const endOwnershipUpdate = Date.now();
        console.log(`Initialized or updated ownership data in ${(endOwnershipUpdate - startOwnershipUpdate)} ms`);

        lists = initializePokemonLists(ownershipData, variants);

        // Save updated ownershipData to IndexedDB
        const startStoreOwnership = Date.now();
        await setOwnershipDataAsync({ data: ownershipData, timestamp: Date.now() });
        // Update timestamp for ownershipData in localStorage
        localStorage.setItem('ownershipTimestamp', Date.now().toString());
        const endStoreOwnership = Date.now();
        console.log(`Stored updated ownership data in IndexedDB in ${(endStoreOwnership - startStoreOwnership)} ms`);

        // Store lists into IndexedDB
        const startStoreLists = Date.now();
        await storeListsInIndexedDB(lists);
        // Update timestamp for lists in localStorage
        localStorage.setItem('listsTimestamp', Date.now().toString());
        const endStoreLists = Date.now();
        console.log(`Stored updated lists in IndexedDB in ${(endStoreLists - startStoreLists)} ms`);
    }

    // Final data setting
    setData({ variants, ownershipData, lists, loading: false, updateOwnership, updateLists });
};