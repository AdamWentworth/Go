// fetchData.js

import { getPokemons } from '../../services/api';
import createPokemonVariants from '../../services/createPokemonVariants';
import { preloadImage } from '../../utils/imageHelpers';
import { determinePokemonKey } from '../../services/determinePokemonKey'
import { isDataFresh } from '../../utils/cacheHelpers';
import { formatTimeAgo } from '../../utils/formattingHelpers';
import { initializePokemonLists } from '../../features/Collect/PokemonOwnership/PokemonTradeListOperations';
import { initializeOrUpdateOwnershipData, initializeOrUpdateOwnershipDataAsync } from '../../features/Collect/PokemonOwnership/pokemonOwnershipStorage';

export const fetchData = async (setData, ownershipDataRef, updateOwnership, updateLists) => {
    console.log("Fetching data from API or cache...");
    const pokemonDataCacheKey = "pokemonData";
    const variantsCacheKey = "pokemonVariants";
    const ownershipDataCacheKey = "pokemonOwnership";
    const listsCacheKey = "pokemonLists";
    const cacheStorageName = 'pokemonCache';

    // Open the cache storage
    const cacheStorage = await caches.open(cacheStorageName);

    // Try to retrieve the cached variants and ownership data simultaneously
    const [cachedVariantsResponse, cachedOwnershipResponse, cachedListsResponse] = await Promise.all([
        cacheStorage.match(variantsCacheKey),
        cacheStorage.match(ownershipDataCacheKey),
        cacheStorage.match(listsCacheKey)
    ]);

    let freshDataAvailable = false;
    let variants, ownershipData, lists;

    // Deserialize responses if available
    const cachedVariants = cachedVariantsResponse ? await cachedVariantsResponse.json() : null;
    const cachedOwnership = cachedOwnershipResponse ? await cachedOwnershipResponse.json() : null;
    const cachedLists = cachedListsResponse ? await cachedListsResponse.json() : null;

    // Log cached data freshness and details
    if (cachedVariants && cachedOwnership && cachedLists) {
        // Both cached data are available
        console.log(`Cached Variants Age: ${formatTimeAgo(cachedVariants.timestamp)}`);
        console.log(`Cached Ownership Data Age: ${formatTimeAgo(cachedOwnership.timestamp)}`);
        console.log(`Cached Lists Data Age: ${formatTimeAgo(cachedLists.timestamp)}`);

    } else if (cachedVariants && !cachedOwnership) {
        // Only cached variants are available
        console.log(`Cached Variants Age: ${formatTimeAgo(cachedVariants.timestamp)}`);
        console.log("Ownership data is missing.");
    } else if (!cachedVariants && cachedOwnership) {
        // Only cached ownership data is available
        console.log(`Cached Ownership Data Age: ${formatTimeAgo(cachedOwnership.timestamp)}`);
        console.log("Variants data is missing.");
    } else {
        // Both cached data are missing
        console.log("Both Variants and Ownership data are missing.");
    }

    // Best case scenario - All Data is less than 24hrs old
    if (cachedVariants && cachedOwnership && cachedLists && isDataFresh(cachedVariants.timestamp) && isDataFresh(cachedOwnership.timestamp) && isDataFresh(cachedLists.timestamp)) {
        console.log("Using cached variants and ownership data");
        variants = cachedVariants.data;
        ownershipData = cachedOwnership.data;
        lists = cachedLists.data;
        freshDataAvailable = true;

    } else if (cachedVariants && cachedOwnership && !isDataFresh(cachedVariants.timestamp) && isDataFresh(cachedOwnership.timestamp)) {
        // Handle case where ownership data is fresh but variants data might be outdated
        console.log("Cached Variants are too old but Ownership Data is current, checking if localstorage pokemon data is fresh");
        let pokemons;
        const cachedData = localStorage.getItem(pokemonDataCacheKey);
        if (cachedData && (Date.now() - JSON.parse(cachedData).timestamp < 24 * 60 * 60 * 1000)) {
            console.log("Using data from local storage");
            pokemons = JSON.parse(cachedData).data;
        } else {
            console.log("Local storage is not fresh, Fetching new data from API");
            pokemons = await getPokemons();
            localStorage.setItem(pokemonDataCacheKey, JSON.stringify({ data: pokemons, timestamp: Date.now() }));
            console.log("Got new data from API, storing in Local Storage");
        }
        
        // Process pokemons into variants
        variants = createPokemonVariants(pokemons);
        variants.forEach(variant => {
            variant.pokemonKey = determinePokemonKey(variant);
            preloadImage(variant.currentImage); // Preload main image
            if (variant.type_1_icon) preloadImage(variant.type_1_icon); // Preload type 1 icon
            if (variant.type_2_icon) preloadImage(variant.type_2_icon); // Preload type 2 icon
        });
        
        // Update cache with new variants
        await cacheStorage.put(variantsCacheKey, new Response(JSON.stringify({ data: variants, timestamp: Date.now() }), {
            headers: { 'Content-Type': 'application/json' }
        }));
        console.log("We have now stored the up to date Variants in the Cache Storage");

        // Prepare keys for ownership data
        const keys = variants.map(variant => variant.pokemonKey);

        // If Variants data has changed, maybe update ownership data too
        ownershipData = await initializeOrUpdateOwnershipDataAsync(keys, variants);
        lists = initializePokemonLists(ownershipData, variants);
        await cacheStorage.put(ownershipDataCacheKey, new Response(JSON.stringify({ data: ownershipData, timestamp: Date.now() }), {
            headers: { 'Content-Type': 'application/json' }
        }));
        await cacheStorage.put(listsCacheKey, new Response(JSON.stringify({ data: lists, timestamp: Date.now() }), {
            headers: { 'Content-Type': 'application/json' }
        }));
        console.log("As the ownership data may be missing the newest Variants, we have initialized any missing variants in ownershipdata");
        freshDataAvailable = true;

    } else if (cachedVariants && cachedOwnership && isDataFresh(cachedVariants.timestamp) && !isDataFresh(cachedOwnership.timestamp)) {
        console.log("Using cached variants but Ownershipdata is older than 24 hours and may be outdated");   
        variants = cachedVariants.data;

        const keys = variants.map(variant => variant.pokemonKey);

        // If Ownership cache data is outdated, update it with new Variants.
        ownershipData = await initializeOrUpdateOwnershipDataAsync(keys, variants);
        console.log("we have now initialized any missing variants in ownershipdata");
        lists = initializePokemonLists(ownershipData, variants);
        await cacheStorage.put(ownershipDataCacheKey, new Response(JSON.stringify({ data: ownershipData, timestamp: Date.now() }), {
            headers: { 'Content-Type': 'application/json' }
        }));
        await cacheStorage.put(listsCacheKey, new Response(JSON.stringify({ data: lists, timestamp: Date.now() }), {
            headers: { 'Content-Type': 'application/json' }
        }));
        freshDataAvailable = true;

    } else if (cachedVariants && !cachedOwnership && Date.now() - cachedVariants.timestamp < 24 * 60 * 60 * 1000) {
        console.log("Using cached variants but rebuilding ownership data");
        variants = cachedVariants.data;
    } else if (cachedVariants && cachedOwnership && isDataFresh(cachedVariants.timestamp) && isDataFresh(cachedOwnership.timestamp) && !cachedLists) {
        console.log("Variants and ownership data are fresh, but lists are missing, initializing lists data");
        variants = cachedVariants.data;
        ownershipData = cachedOwnership.data;
        lists = initializePokemonLists(ownershipData, variants);
        await cacheStorage.put(listsCacheKey, new Response(JSON.stringify({ data: lists, timestamp: Date.now() }), {
            headers: { 'Content-Type': 'application/json' }
        }));
        freshDataAvailable = true;
    } else {
        console.log("Cached data is stale or incomplete, refetching...");
    }

    if (!freshDataAvailable && variants) {
        // Handle variants fresh, so initialize ownership data
        const keys = variants.map(variant => variant.pokemonKey);
        ownershipData = initializeOrUpdateOwnershipData(keys, variants);
        lists = initializePokemonLists(ownershipData, variants);
        await cacheStorage.put(ownershipDataCacheKey, new Response(JSON.stringify({ data: ownershipData, timestamp: Date.now() }), {
            headers: { 'Content-Type': 'application/json' }
        }));
        await cacheStorage.put(listsCacheKey, new Response(JSON.stringify({ data: lists, timestamp: Date.now() }), {
            headers: { 'Content-Type': 'application/json' }
        }));
        freshDataAvailable = true;
    }

    if (!freshDataAvailable) {
        let pokemons;
        const cachedData = localStorage.getItem(pokemonDataCacheKey);
        if (cachedData && (Date.now() - JSON.parse(cachedData).timestamp < 24 * 60 * 60 * 1000)) {
            console.log("Using data from local storage");
            pokemons = JSON.parse(cachedData).data;
        } else {
            console.log("Fetching new data from API");
            pokemons = await getPokemons();
            localStorage.setItem(pokemonDataCacheKey, JSON.stringify({ data: pokemons, timestamp: Date.now() }));
        }

        variants = createPokemonVariants(pokemons);
        variants.forEach(variant => {
            variant.pokemonKey = determinePokemonKey(variant);
            preloadImage(variant.currentImage);
            if (variant.type_1_icon) preloadImage(variant.type_1_icon);
            if (variant.type_2_icon) preloadImage(variant.type_2_icon);
        });

        await cacheStorage.put(variantsCacheKey, new Response(JSON.stringify({ data: variants, timestamp: Date.now() }), {
            headers: { 'Content-Type': 'application/json' }
        }));

        const keys = variants.map(variant => variant.pokemonKey);
        ownershipData = initializeOrUpdateOwnershipData(keys, variants);
        lists = initializePokemonLists(ownershipData, variants);
        await cacheStorage.put(ownershipDataCacheKey, new Response(JSON.stringify({ data: ownershipData, timestamp: Date.now() }), {
            headers: { 'Content-Type': 'application/json' }
        }));
        await cacheStorage.put(listsCacheKey, new Response(JSON.stringify({ data: lists, timestamp: Date.now() }), {
            headers: { 'Content-Type': 'application/json' }
        }));
    }

    setData({ variants, ownershipData, lists, loading: false, updateOwnership, updateLists });
};