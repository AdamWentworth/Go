import { generateUUID, validateUUID } from '../utils/PokemonIDUtils';
import { createNewDataForVariant } from './pokemonOwnershipManager';

export function updatePokemonOwnership(pokemonKey, newStatus, variants, ownershipData, setOwnershipData) {
    const { baseKey, hasUUID } = parsePokemonKey(pokemonKey);

    const variantData = variants.find(variant => variant.pokemonKey === baseKey);
    if (!variantData) {
        console.error("No variant data found for base key:", baseKey);
        return;
    }

    if (hasUUID) {
        handleSpecificInstanceWithUUID(pokemonKey, newStatus, ownershipData, variants);
    } else {
        handleDefaultEntry(pokemonKey, newStatus, ownershipData, variantData, variants);
    }

    setTimeout(() => {
        setOwnershipData(ownershipData);  // This should trigger a re-render
    }, 0);
}

function parsePokemonKey(pokemonKey) {
    const keyParts = pokemonKey.split('_');
    const possibleUUID = keyParts[keyParts.length - 1];
    const hasUUID = validateUUID(possibleUUID);

    if (hasUUID) {
        keyParts.pop();  // Remove the UUID part if it's valid
    }

    return {
        baseKey: keyParts.join('_'),
        hasUUID
    };
}


function handleDefaultEntry(pokemonKey, newStatus, ownershipData, variantData, variants) {
    let needNewInstance = true;
    Object.keys(ownershipData).forEach(key => {
        // Check if the key starts with the pokemonKey and if the instance is unowned and not wanted
        if (key.startsWith(pokemonKey) && ownershipData[key].is_unowned && !ownershipData[key].is_wanted) {
            updateInstanceStatus(key, newStatus, ownershipData, pokemonKey, variants);
            needNewInstance = false;
        }
    });

    // If no suitable instance is found, create a new one
    if (needNewInstance) {
        const newKey = `${pokemonKey}_${generateUUID()}`;
        ownershipData[newKey] = createNewDataForVariant(variantData);
        updateInstanceStatus(newKey, newStatus, ownershipData, pokemonKey, variants);
    }
}

function updateInstanceStatus(pokemonKey, newStatus, ownershipData, baseKey, variants) {
    const instance = ownershipData[pokemonKey];
    console.log(`Updating status for instance ${pokemonKey} to ${newStatus}`);

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

    updateTradeList(pokemonKey, ownershipData, variants, newStatus);

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

    updateTradeList(pokemonKey, ownershipData, variants, newStatus);
    
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
            break;            
    }
}


function updateTradeList(pokemonKey, ownershipData, variants, newStatus) {
    console.log("Starting trade list update for:", pokemonKey);

    const instance = ownershipData[pokemonKey];
    instance.trade_list = {};
    console.log("Trade list cleared.");

    const relatedInstances = Object.entries(ownershipData).filter(([key, _]) => key !== pokemonKey);
    console.log("Related instances found:", relatedInstances.length);

    relatedInstances.forEach(([key, otherInstance]) => {
        const { baseKey: baseKeyOfOther } = parsePokemonKey(key);
        const otherVariantDetails = variants.find(variant => variant.pokemonKey === baseKeyOfOther);
        const currentVariantDetails = variants.find(variant => variant.pokemonKey === parsePokemonKey(pokemonKey).baseKey);

        if (otherVariantDetails && currentVariantDetails) {
            const simplifiedInstanceDetail = {
                pokemonKey: key,
                currentImage: otherVariantDetails.currentImage
            };

            if (newStatus === 'Trade' && otherInstance.is_wanted) {
                console.log(`Adding to trade list for trade: ${key}`);
                instance.trade_list[key] = simplifiedInstanceDetail;

                if (!otherInstance.trade_list) {
                    otherInstance.trade_list = {};
                    console.log(`Initializing trade list for reciprocal instance: ${key}`);
                }
                otherInstance.trade_list[pokemonKey] = {
                    pokemonKey: pokemonKey,
                    currentImage: currentVariantDetails.currentImage
                };
                console.log(`Reciprocal update done for: ${key}`);
            }
            else if (newStatus === 'Wanted' && otherInstance.is_for_trade) {
                console.log(`Adding to trade list for wanted: ${key}`);
                instance.trade_list[key] = simplifiedInstanceDetail;

                if (!otherInstance.trade_list) {
                    otherInstance.trade_list = {};
                    console.log(`Initializing trade list for reciprocal instance: ${key}`);
                }
                otherInstance.trade_list[pokemonKey] = {
                    pokemonKey: pokemonKey,
                    currentImage: currentVariantDetails.currentImage
                };
                console.log(`Reciprocal update done for: ${key}`);
            }
        } else {
            console.log("No variant details available for:", baseKeyOfOther);
        }
    });
    console.log("Trade list update completed for:", pokemonKey);
}