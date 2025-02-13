// fetchData.js

import { getPokemons } from '../../services/api';
import createPokemonVariants from './createPokemonVariants';
import { preloadImage } from '../../utils/imageHelpers';
import { determinePokemonKey } from '../../utils/PokemonIDUtils';
import { isDataFresh } from '../../utils/cacheHelpers';
import { formatTimeAgo } from '../../utils/formattingHelpers';
import { initializePokemonLists } from './PokemonTradeListOperations';
import sortPokedexLists from './sortPokedexLists';

import {
    getAllFromDB,
    getAllListsFromDB,
    storeListsInIndexedDB,
    putBulkIntoDB,
    storePokedexListsInIndexedDB,
    getAllPokedexListsFromDB
} from '../../services/indexedDB';

import {
    initializeOrUpdateOwnershipDataAsync,
    getOwnershipDataAsync
} from './pokemonOwnershipStorage';

export const fetchData = async (setData, updateOwnership, updateLists) => {
    console.log("Fetching data from API or cache...");

    // -------------------------------------------------------------------------
    // Retrieve timestamps from localStorage
    // -------------------------------------------------------------------------
    const ownershipTimestamp = parseInt(localStorage.getItem('ownershipTimestamp'), 10) || 0;
    const variantsTimestamp = parseInt(localStorage.getItem('variantsTimestamp'), 10) || 0;
    const listsTimestamp = parseInt(localStorage.getItem('listsTimestamp'), 10) || 0;
    // NEW: for Pokedex lists
    const pokedexListsTimestamp = parseInt(localStorage.getItem('pokedexListsTimestamp'), 10) || 0;

    // -------------------------------------------------------------------------
    // Check data freshness
    // -------------------------------------------------------------------------
    const variantsFresh = variantsTimestamp && isDataFresh(variantsTimestamp);
    const ownershipFresh = ownershipTimestamp && isDataFresh(ownershipTimestamp);
    const listsFresh = listsTimestamp && isDataFresh(listsTimestamp);
    // NEW: for Pokedex lists
    const pokedexListsFresh = pokedexListsTimestamp && isDataFresh(pokedexListsTimestamp);

    // -------------------------------------------------------------------------
    // Log cached data freshness and details
    // -------------------------------------------------------------------------
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
    // NEW: for Pokedex lists
    if (pokedexListsTimestamp) {
        console.log(`Cached PokedexLists Age: ${formatTimeAgo(pokedexListsTimestamp)}`);
    } else {
        console.log("PokedexLists data is missing.");
    }

    // -------------------------------------------------------------------------
    // First: get variants (quickly) so the UI can show basic data immediately
    // -------------------------------------------------------------------------
    let variants;
    if (variantsFresh) {
        console.log("Using cached variants");
        const startVariantsRetrieval = Date.now();
        variants = await getAllFromDB('pokemonVariants');
        const endVariantsRetrieval = Date.now();
        console.log(
            `Retrieved variants from IndexedDB in ${endVariantsRetrieval - startVariantsRetrieval} ms`
        );

        // ADDED SIZE LOG
        try {
            const variantsSize = new Blob([JSON.stringify(variants)]).size;
            console.log(`Size of retrieved cached variants in bytes: ${variantsSize}`);
        } catch (err) {
            console.log('Error measuring size of cached variants:', err);
        }

    } else {
        console.log("Variants are stale or missing, updating...");
        variants = await fetchAndProcessVariants();
    }

    // Immediately set initial data with just variants
    setData({
        variants,
        ownershipData: null,
        lists: null,
        // We'll load pokedexLists in the background, so initially null:
        pokedexLists: null,
        loading: true,
        updateOwnership,
        updateLists
    });

    // -------------------------------------------------------------------------
    // Process the remaining data (ownership, lists, pokedexLists) in the background
    // -------------------------------------------------------------------------
    processRemainingData(variants, setData, updateOwnership, updateLists, {
        ownershipFresh,
        listsFresh,
        pokedexListsFresh,
        variantsFresh
    });

    // Return variants immediately
    return variants;
};

async function processRemainingData(
    variants, 
    setData, 
    updateOwnership, 
    updateLists, 
    freshness
) {
    const { ownershipFresh, listsFresh, pokedexListsFresh, variantsFresh } = freshness;

    // If fresh = true, that means it wasn't stale, so no update was needed for that piece
    // We track if variants were updated: if they were, we likely need to re-generate everything.
    const variantsUpdated = !variantsFresh;
    let ownershipUpdated = false;

    try {
        // ---------------------------------------------------------------------
        // Get ownership data from IndexedDB if fresh, or re-initialize if not
        // ---------------------------------------------------------------------
        const { data: cachedOwnership } = await getOwnershipDataAsync();
        if (cachedOwnership) {
            // ADDED SIZE LOG
            try {
                const ownershipSize = new Blob([JSON.stringify(cachedOwnership)]).size;
                console.log(`Size of cached ownership data in bytes: ${ownershipSize}`);
            } catch (err) {
                console.log('Error measuring size of cached ownership data:', err);
            }
        }

        let ownershipData;
        if (ownershipFresh && !variantsUpdated) {
            // If ownership is fresh and variants haven't changed, we can use the cached data
            ownershipData = cachedOwnership || null;
        } else {
            console.log("Ownership data is stale OR variants updated, updating ownership data...");
            const keys = variants.map(variant => variant.pokemonKey);
            ownershipData = await initializeOrUpdateOwnershipDataAsync(keys, variants);
            ownershipUpdated = true;

            // ADDED SIZE LOG
            try {
                const newOwnershipSize = new Blob([JSON.stringify(ownershipData)]).size;
                console.log(`Size of new ownership data in bytes: ${newOwnershipSize}`);
            } catch (err) {
                console.log('Error measuring size of new ownership data:', err);
            }
        }

        // ---------------------------------------------------------------------
        // Update state with ownership data so UI can reflect that
        // ---------------------------------------------------------------------
        setData(prevData => ({
            ...prevData,
            ownershipData,
            loading: true
        }));

        // ---------------------------------------------------------------------
        // Get "lists" (owned, unowned, wanted, trade) from IndexedDB or rebuild
        // ---------------------------------------------------------------------
        let lists;
        if (listsFresh && ownershipFresh && !variantsUpdated) {
            const startListsRetrieval = Date.now();
            lists = await getAllListsFromDB();
            const endListsRetrieval = Date.now();
            console.log(
                `Retrieved lists from IndexedDB in ${endListsRetrieval - startListsRetrieval} ms`
            );

            // ADDED SIZE LOG
            try {
                const listsSize = new Blob([JSON.stringify(lists)]).size;
                console.log(`Size of cached lists data in bytes: ${listsSize}`);
            } catch (err) {
                console.log('Error measuring size of cached lists data:', err);
            }
        } else {
            console.log("Lists are stale or ownership/variants updated, updating lists...");
            lists = initializePokemonLists(ownershipData, variants);

            // ADDED SIZE LOG
            try {
                const newListsSize = new Blob([JSON.stringify(lists)]).size;
                console.log(`Size of new lists data in bytes: ${newListsSize}`);
            } catch (err) {
                console.log('Error measuring size of new lists data:', err);
            }

            // Store updated lists in IndexedDB
            const startStoreLists = Date.now();
            await storeListsInIndexedDB(lists);
            localStorage.setItem('listsTimestamp', Date.now().toString());
            const endStoreLists = Date.now();
            console.log(`Stored updated lists in IndexedDB in ${endStoreLists - startStoreLists} ms`);
        }

        // ---------------------------------------------------------------------
        // Get or build the PokedexLists. This is *not* tied to ownership, so
        // it mainly depends on whether variants changed or if data is stale.
        // ---------------------------------------------------------------------
        let pokedexLists;
        if (pokedexListsFresh && !variantsUpdated) {
            console.log("Using cached PokedexLists data...");
            pokedexLists = await getAllPokedexListsFromDB();
            
            // ADDED SIZE LOG
            try {
                const pokedexListsSize = new Blob([JSON.stringify(pokedexLists)]).size;
                console.log(`Size of cached PokedexLists in bytes: ${pokedexListsSize}`);
            } catch (err) {
                console.log('Error measuring size of cached PokedexLists data:', err);
            }
        } else {
            console.log("PokedexLists are stale or variants updated, regenerating...");
            pokedexLists = sortPokedexLists(variants);

            // Store the new PokedexLists in IndexedDB
            try {
                await storePokedexListsInIndexedDB(pokedexLists);
                localStorage.setItem('pokedexListsTimestamp', Date.now().toString());
                console.log("Successfully stored new PokedexLists in PokedexListsDB");
            } catch (error) {
                console.error("Failed to store PokedexLists in PokedexListsDB:", error);
            }

            // ADDED SIZE LOG
            try {
                const newPokedexListsSize = new Blob([JSON.stringify(pokedexLists)]).size;
                console.log(`Size of new PokedexLists data in bytes: ${newPokedexListsSize}`);
            } catch (err) {
                console.log('Error measuring size of new PokedexLists data:', err);
            }
        }

        // ---------------------------------------------------------------------
        // Final update: we now have ownershipData, lists, and pokedexLists
        // ---------------------------------------------------------------------
        setData(prevData => ({
            ...prevData,
            lists,
            pokedexLists,   // Provide the newly fetched or cached Pokedex lists
            loading: false
        }));

    } catch (error) {
        console.error('Error processing remaining data:', error);
        setData(prevData => ({
            ...prevData,
            loading: false,
            error: 'Failed to load complete data'
        }));
    }
}

/**
 * Fetches fresh Pokémon data from the API and processes them into variants.
 * Removes any reliance on localStorage to store the entire raw Pokémon data.
 */
async function fetchAndProcessVariants() {
    console.log("Fetching new data from API");

    // Fetch directly from API
    const startFetchPokemons = Date.now();
    let pokemons = await getPokemons();
    const endFetchPokemons = Date.now();
    console.log(`Fetched new Pokémon data from API in ${endFetchPokemons - startFetchPokemons} ms`);

    // ADDED SIZE LOG
    try {
        const pokemonsSize = new Blob([JSON.stringify(pokemons)]).size;
        console.log(`Size of newly fetched Pokémon data in bytes: ${pokemonsSize}`);
    } catch (err) {
        console.log('Error measuring size of newly fetched Pokémon data:', err);
    }

    // Process pokemons into variants
    const startProcessVariants = Date.now();
    let variants = createPokemonVariants(pokemons);
    variants.forEach(variant => {
        variant.pokemonKey = determinePokemonKey(variant);
        // Preload images
        preloadImage(variant.currentImage);
        if (variant.type_1_icon) preloadImage(variant.type_1_icon);
        if (variant.type_2_icon) preloadImage(variant.type_2_icon);
    });
    const endProcessVariants = Date.now();
    console.log(`Processed Pokémon into variants in ${endProcessVariants - startProcessVariants} ms`);

    // ADDED SIZE LOG
    try {
        const variantsSize = new Blob([JSON.stringify(variants)]).size;
        console.log(`Size of processed variants in bytes: ${variantsSize}`);
    } catch (err) {
        console.log('Error measuring size of processed variants:', err);
    }

    // Store all variants in IndexedDB
    const startStoreVariants = Date.now();
    try {
        await putBulkIntoDB('pokemonVariants', variants);
    } catch (error) {
        console.error('Failed to store variants in IndexedDB:', error);
    }
    const endStoreVariants = Date.now();
    console.log(`Stored variants in IndexedDB in ${endStoreVariants - startStoreVariants} ms`);

    // Update timestamp for variants in localStorage
    localStorage.setItem('variantsTimestamp', Date.now().toString());
    console.log("Stored updated variants in IndexedDB");

    return variants;
}
