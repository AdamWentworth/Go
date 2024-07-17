import { generateUUID } from '../utils/PokemonIDUtils';
import { createNewDataForVariant } from './pokemonOwnershipManager';
import { parsePokemonKey } from '../utils/PokemonIDUtils';

export async function updatePokemonOwnership(pokemonKey, newStatus, variants, ownershipData, callback, isLoggedIn) {
    const { baseKey, hasUUID } = parsePokemonKey(pokemonKey);
    const variantData = variants.find(variant => variant.pokemonKey === baseKey);

    if (!variantData) {
        console.error("No variant data found for base key:", baseKey);
        callback(); // Ensuring callback is called even if there's an error
        return;
    }

    let updatedKey;
    if (hasUUID) {
        updatedKey = await handleSpecificInstanceWithUUID(pokemonKey, newStatus, ownershipData, variants, isLoggedIn);
    } else {
        updatedKey = handleDefaultEntry(pokemonKey, newStatus, ownershipData, variantData, variants);
    }

    callback(updatedKey); // Ensures that callback is always called to update the counter
}

function handleDefaultEntry(pokemonKey, newStatus, ownershipData, variantData, variants) {
    let needNewInstance = true;
    let updatedKey;

    Object.keys(ownershipData).forEach(key => {
        let keyParts = key.split('_');
        keyParts.pop(); // Remove the UUID part if present
        let currentPrefix = keyParts.join('_');

        if (currentPrefix === pokemonKey && ownershipData[key].is_unowned && !ownershipData[key].is_wanted) {
            updateInstanceStatus(key, newStatus, ownershipData, pokemonKey, variants);
            updatedKey = key;
            needNewInstance = false;
        }
    });

    if (needNewInstance) {
        const newKey = `${pokemonKey}_${generateUUID()}`;
        ownershipData[newKey] = createNewDataForVariant(variantData);
        updateInstanceStatus(newKey, newStatus, ownershipData, pokemonKey, variants);
        updatedKey = newKey;
    }

    return updatedKey;
}

function updateInstanceStatus(pokemonKey, newStatus, ownershipData, baseKey, variants) {
    const instance = ownershipData[pokemonKey];

    if ((newStatus === 'Trade' && instance.lucky) || instance.shadow) {
        alert(`Cannot move ${baseKey} to Trade as it is ${instance.lucky ? 'lucky' : 'shadow'}.`);
        return;
    }

    instance.is_unowned = newStatus === 'Unowned';
    instance.is_owned = newStatus === 'Owned' || newStatus === 'Trade';
    instance.is_for_trade = newStatus === 'Trade';
    instance.is_wanted = newStatus === 'Wanted';

    Object.keys(ownershipData).forEach(key => {
        let keyParts = key.split('_');
        keyParts.pop();
        let currentPrefix = keyParts.join('_');

        if (currentPrefix === baseKey && key !== pokemonKey) {
            switch (newStatus) {
                case 'Unowned':
                    ownershipData[key].is_owned = false;
                    ownershipData[key].is_for_trade = false;
                    break;
                case 'Owned':
                case 'Trade':
                    ownershipData[key].is_unowned = false;
                    break;
                case 'Wanted':
                    if (ownershipData[key].is_owned) {
                        instance.is_unowned = false;
                    }
                    break;
            }
        }
    });

    if (newStatus === 'Trade' && !instance.is_owned) {
        instance.is_owned = true;
    }

    if (newStatus === 'Wanted') {
        let anyOwned = Object.values(ownershipData).some(data => {
            let keyParts = String(data.pokemonKey).split('_');
            keyParts.pop();
            let currentPrefix = keyParts.join('_');

            let isOwnedAndMatch = data.is_owned && currentPrefix === baseKey;
            return isOwnedAndMatch;
        });

        if (!anyOwned) {
            instance.is_unowned = true;
        }
    }
}

async function handleSpecificInstanceWithUUID(pokemonKey, newStatus, ownershipData, variants, isLoggedIn) {
    const instance = ownershipData[pokemonKey];

    if ((newStatus === 'Trade' && instance.lucky) || instance.shadow) {
        alert(`Cannot move ${pokemonKey} to Trade as it is ${instance.lucky ? 'lucky' : 'shadow'}.`);
        return;
    }

    const updateBatchedUpdates = async (key, data) => {
        const cacheStorage = await caches.open('pokemonCache');
        const cachedUpdatesResponse = await cacheStorage.match('/batchedUpdates');
        let updatesData = cachedUpdatesResponse ? await cachedUpdatesResponse.json() : {};

        updatesData[key] = data;

        await cacheStorage.put('/batchedUpdates', new Response(JSON.stringify(updatesData), {
            headers: { 'Content-Type': 'application/json' }
        }));
    };

    switch (newStatus) {
        case 'Owned':
            instance.is_owned = true;
            instance.is_for_trade = false;
            instance.is_unowned = false;
            instance.is_wanted = false;
            break;
        case 'Trade':
            instance.is_owned = true;
            instance.is_for_trade = true;
            instance.is_unowned = false;
            instance.is_wanted = false;
            break;
        case 'Wanted':
            if (instance.is_owned) {
                let keyParts = pokemonKey.split('_');
                keyParts.pop();
                let basePrefix = keyParts.join('_');
                const newKey = `${basePrefix}_${generateUUID()}`;
                const newData = { 
                    ...instance,
                    is_wanted: true,
                    is_owned: false,  
                    is_for_trade: false,
                    is_unowned: false }  
                ownershipData[newKey] = newData;
                return newKey;
            } else {
                instance.is_wanted = true;
                const keyParts = pokemonKey.split('_');
                keyParts.pop();
                const prefix = keyParts.join('_');

                let anyOwned = Object.values(ownershipData).some(data => {
                    if (data.is_owned && data.pokemonKey) {
                        let startsWith = data.pokemonKey.startsWith(prefix);
                        return startsWith;
                    }
                    return false;
                });

                instance.is_unowned = !anyOwned;
                return pokemonKey;
            }
            break;
        case 'Unowned':
            let keyParts = pokemonKey.split('_');
            keyParts.pop();
            let basePrefix = keyParts.join('_');

            let relatedInstances = Object.keys(ownershipData).filter(key => {
                let parts = key.split('_');
                parts.pop();
                let currentPrefix = parts.join('_');
                return currentPrefix === basePrefix && key !== pokemonKey;
            });

            let isOnlyInstance = relatedInstances.length === 0;

            if (!isOnlyInstance) {
                if (isLoggedIn) {
                    instance.is_unowned = true;
                    instance.is_owned = false;
                    instance.is_for_trade = false;
                    instance.is_wanted = false;
                    await updateBatchedUpdates(pokemonKey, instance);
                }
                // delete ownershipData[pokemonKey];
            } else {
                instance.is_unowned = true;
                instance.is_owned = false;
                instance.is_for_trade = false;
                instance.is_wanted = false;
                if (isLoggedIn) {
                    await updateBatchedUpdates(pokemonKey, instance);
                }
            }
            return pokemonKey;
            break;
    }

    return pokemonKey;
}