import { generateUUID } from '../utils/PokemonIDUtils';
import { createNewDataForVariant } from './pokemonOwnershipManager';
import { parsePokemonKey } from '../utils/PokemonIDUtils';

export function updatePokemonOwnership(pokemonKey, newStatus, variants, ownershipData, callback) {
    const { baseKey, hasUUID } = parsePokemonKey(pokemonKey);
    const variantData = variants.find(variant => variant.pokemonKey === baseKey);

    if (!variantData) {
        console.error("No variant data found for base key:", baseKey);
        callback(); // Ensuring callback is called even if there's an error
        return;
    }

    let updatedKey;
    if (hasUUID) {
        updatedKey = handleSpecificInstanceWithUUID(pokemonKey, newStatus, ownershipData, variants);
    } else {
        updatedKey = handleDefaultEntry(pokemonKey, newStatus, ownershipData, variantData, variants);
    }

    callback(updatedKey); // Ensures that callback is always called to update the counter
}

function handleDefaultEntry(pokemonKey, newStatus, ownershipData, variantData, variants) {
    let needNewInstance = true;
    let updatedKey;
    
    Object.keys(ownershipData).forEach(key => {
        // Check if the key starts with the pokemonKey and if the instance is unowned and not wanted
        if (key.startsWith(pokemonKey) && ownershipData[key].is_unowned && !ownershipData[key].is_wanted) {
            updateInstanceStatus(key, newStatus, ownershipData, pokemonKey, variants);
            updatedKey = key;
            needNewInstance = false;
        }
    });

    // If no suitable instance is found, create a new one
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
        console.log(`Move to Trade blocked due to status: ${instance.lucky ? 'lucky' : 'shadow'}`);
        return;
    }

    // Initial setup for statuses based on the newStatus
    instance.is_unowned = newStatus === 'Unowned';
    instance.is_owned = newStatus === 'Owned' || newStatus === 'Trade';
    instance.is_for_trade = newStatus === 'Trade';
    instance.is_wanted = newStatus === 'Wanted';

    // Conditional application of status updates to other instances sharing the same prefix
    Object.keys(ownershipData).forEach(key => {
        if (key.startsWith(baseKey) && key !== instance.pokemon_id) {
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
        let anyOwned = Object.values(ownershipData).some(data => {
            let isOwnedAndMatch = data.is_owned && String(data.pokemonKey).startsWith(baseKey);
            return isOwnedAndMatch;
        });

        if (!anyOwned) {
            instance.is_unowned = true;
        }
    }
}

function handleSpecificInstanceWithUUID(pokemonKey, newStatus, ownershipData, variants) {
    const instance = ownershipData[pokemonKey];

    if ((newStatus === 'Trade' && instance.lucky) || instance.shadow) {
        alert(`Cannot move ${pokemonKey} to Trade as it is ${instance.lucky ? 'lucky' : 'shadow'}.`);
        return;
    }

    // updateTradeList(pokemonKey, ownershipData, variants, newStatus);
    
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
                    is_unowned: false }  
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
            // Isolating the prefix by excluding the last UUID segment
            let keyParts = pokemonKey.split('_');
            keyParts.pop(); // Remove the UUID part
            let basePrefix = keyParts.join('_'); // Rejoin to form the actual prefix
        
            let relatedInstances = Object.keys(ownershipData).filter(key => key.startsWith(basePrefix) && key !== pokemonKey);
            let isOnlyInstance = relatedInstances.length === 0; // Check if there are no other related instances
        
            if (!isOnlyInstance) {
                // If there are other instances, confirm deletion
                delete ownershipData[pokemonKey]; // Delete the instance from ownership data
            }
            else {
                // If it's the only instance, just mark as unowned without deletion
                instance.is_unowned = true;
                instance.is_owned = false;
                instance.is_for_trade = false;
                instance.is_wanted = false; // Explicitly setting is_wanted to false
            }
            return pokemonKey;
            break;            
    }

    return pokemonKey; // Return the original key if none of the conditions match
}