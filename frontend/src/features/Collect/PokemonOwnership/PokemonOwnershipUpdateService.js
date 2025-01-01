// PokemonOwnershipUpdateService.js

import { generateUUID, parsePokemonKey } from '../../../utils/PokemonIDUtils';
import { createNewInstanceData } from '../../../contexts/PokemonData/createNewInstanceData';
import { updateRegistrationStatus } from './handlers/handleRegistrationStatus';

export async function updatePokemonOwnership(pokemonKey, newStatus, variants, ownershipData, lists) {
    const { baseKey, hasUUID } = parsePokemonKey(pokemonKey);
    const variantData = variants.find(variant => variant.pokemonKey === baseKey);

    if (!variantData) {
        console.error("No variant data found for base key:", baseKey);
        return null; // Or throw an error if appropriate
    }
    console.log('updating in updatePokemonOwnership')
    let updatedKey;
    if (hasUUID) {
        updatedKey = handleInstanceUUIDEntry(pokemonKey, newStatus, ownershipData);
    } else {
        updatedKey = handleBaseKeyEntry(pokemonKey, newStatus, ownershipData, variantData, variants);
    }

    updateLists(updatedKey, newStatus, lists);
    return updatedKey; // Return the updated key
}

function handleBaseKeyEntry(pokemonKey, newStatus, ownershipData, variantData, variants) {
    let needNewInstance = true;
    let updatedKey;

    Object.keys(ownershipData).forEach(key => {
        let keyParts = key.split('_');
        keyParts.pop(); // Remove the UUID part if present
        let currentPrefix = keyParts.join('_');

        // Check if the key matches the pokemonKey exactly
        if (currentPrefix === pokemonKey && ownershipData[key].is_unowned && !ownershipData[key].is_wanted) {
            updateInstanceStatus(key, newStatus, ownershipData, pokemonKey, variants);
            updatedKey = key;
            needNewInstance = false;
        }
    });

    // If no suitable instance is found, create a new one
    if (needNewInstance) {
        const newKey = `${pokemonKey}_${generateUUID()}`;
        ownershipData[newKey] = createNewInstanceData(variantData);
        updateInstanceStatus(newKey, newStatus, ownershipData, pokemonKey);
        updatedKey = newKey;
    }

    return updatedKey;
}

function updateInstanceStatus(pokemonKey, newStatus, ownershipData, baseKey) {
    const instance = ownershipData[pokemonKey];

    if (newStatus === 'Trade' || newStatus === 'Wanted') {
        if (instance.lucky || instance.shadow || (instance.pokemon_id === 2270 || instance.pokemon_id === 2271)) {
            alert(`Cannot move ${pokemonKey} to ${newStatus} as it is ${instance.lucky ? 'lucky' : instance.shadow ? 'shadow' : 'a fusion Pokemon'}.`);
            console.log(`Move to ${newStatus} blocked due to status: ${instance.lucky ? 'lucky' : 'shadow'}`);
            return;
        }
    } 

    // Initial setup for statuses based on the newStatus
    instance.is_unowned = newStatus === 'Unowned';
    instance.is_owned = newStatus === 'Owned' || newStatus === 'Trade';
    instance.is_for_trade = newStatus === 'Trade';
    instance.is_wanted = newStatus === 'Wanted';

    // Conditional application of status updates to other instances sharing the same prefix
    Object.keys(ownershipData).forEach(key => {
        let keyParts = key.split('_');
        keyParts.pop(); // Remove the UUID part if present
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

    // Ensure that if the new status is 'Trade', the instance is marked as owned
    if (newStatus === 'Trade' && !instance.is_owned) {
        instance.is_owned = true;
    }

    // Additional handling to ensure the 'Wanted' status doesn't incorrectly set 'is_unowned' to false
    if (newStatus === 'Wanted') {
        let anyOwned = Object.keys(ownershipData).some(key => {
            let keyParts = key.split('_');
            keyParts.pop(); // Remove the UUID part if present
            let currentPrefix = keyParts.join('_');
    
            let isOwnedAndMatch = ownershipData[key].is_owned && currentPrefix === baseKey;
            return isOwnedAndMatch;
        });
        if (anyOwned) { // Update the condition to properly set `is_unowned` based on owned status
            instance.is_unowned = false; // Since we have an owned instance with the same baseKey
        } else {
            instance.is_unowned = true; // No owned instance found, so mark it as unowned
        }
    }    

    // Update the `registered` status based on ownership and trade conditions
    instance.registered = instance.is_owned || instance.is_for_trade || (instance.is_wanted && !instance.is_unowned);

    // Update the registration status based on shared forms
    updateRegistrationStatus(instance, ownershipData);
}

function handleInstanceUUIDEntry(pokemonKey, newStatus, ownershipData) {
    const instance = ownershipData[pokemonKey];

    if (newStatus === 'Trade' || newStatus === 'Wanted') {
        if (instance.lucky || instance.shadow || (instance.pokemon_id === 2270 || instance.pokemon_id === 2271)) {
            alert(`Cannot move ${pokemonKey} to ${newStatus} as it is ${instance.lucky ? 'lucky' : instance.shadow ? 'shadow' : 'a fusion Pokemon'}.`);
            console.log(`Move to ${newStatus} blocked due to status: ${instance.lucky ? 'lucky' : 'shadow'}`);
            return;
        }
    }    
    
    switch (newStatus) {
        case 'Owned':
            instance.is_owned = true;
            instance.is_for_trade = false;  // Ensure it's not for trade when set to owned directly
            instance.is_unowned = false;
            instance.is_wanted = false;
            break;
        case 'Trade':
            instance.is_owned = true;  // Ensure that a tradeable instance is owned
            instance.is_for_trade = true;
            instance.is_unowned = false;
            instance.is_wanted = false;
            break;
        case 'Wanted':
            // Create a new instance if transitioning to wanted from owned
            if (instance.is_owned) {
                let keyParts = pokemonKey.split('_');
                keyParts.pop(); // Remove the UUID part
                let basePrefix = keyParts.join('_'); // Rejoin to form the actual prefix
                const newKey = `${basePrefix}_${generateUUID()}`;
                const newData = { 
                    ...instance,
                    is_wanted: true,
                    is_owned: false,  
                    is_for_trade: false,
                    is_unowned: false 
                };
                ownershipData[newKey] = newData;
                return newKey;

            } else {
                instance.is_wanted = true;
                // Extract the prefix by joining all parts except the last segment which is presumed to be the UUID
                const keyParts = pokemonKey.split('_');
                keyParts.pop(); // Remove the last segment (UUID)
                const prefix = keyParts.join('_'); // Rejoin the rest as the prefix

                // Check if there are any other owned instances with the same prefix
                let anyOwned = Object.values(ownershipData).some(data => {
                    if (data.is_owned && data.pokemonKey) {
                        let startsWith = data.pokemonKey.startsWith(prefix);
                        return startsWith;
                    }
                    return false;
                });

                // Set is_unowned based on the existence of any owned instances
                instance.is_unowned = !anyOwned;
                return pokemonKey;
            }
            break;
        case 'Unowned':
            instance.is_unowned = true;
            instance.is_owned = false;
            instance.is_for_trade = false;
            instance.is_wanted = false; // Explicitly setting is_wanted to false
            break;                        
    }

    // Update the `registered` status based on ownership and trade conditions
    instance.registered = instance.is_owned || instance.is_for_trade || (instance.is_wanted && !instance.is_unowned);

    // Update the registration status based on shared forms
    updateRegistrationStatus(instance, ownershipData);

    return pokemonKey; // Return the original key if none of the conditions match
}

// Utility function to update the lists based on the ownership status
function updateLists(pokemonKey, newStatus, lists) {
    // Remove the pokemonKey from all lists to avoid duplicates
    Object.keys(lists).forEach(listKey => {
        delete lists[listKey][pokemonKey];
    });

    // Determine the appropriate list based on the new status and add the key
    switch (newStatus) {
        case 'Owned':
            lists.owned[pokemonKey] = true;
            break;
        case 'Trade':
            lists.trade[pokemonKey] = true;
            break;
        case 'Wanted':
            lists.wanted[pokemonKey] = true;
            break;
        case 'Unowned':
            lists.unowned[pokemonKey] = true;
            break;
    }
}