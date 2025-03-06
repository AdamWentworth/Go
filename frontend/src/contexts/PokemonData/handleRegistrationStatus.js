// updateRegistrationStatus.js

import { oneWaySharedFormPokemonIDs } from '../../utils/constants'

// Updated function to handle shared registrations
export function updateRegistrationStatus(instance, ownershipData) {
    const originalPokemonID = instance.pokemon_id;

    // Find the shared group that includes this pokemon_id
    let sharedGroup = null;

    for (const key in oneWaySharedFormPokemonIDs) {
        const group = oneWaySharedFormPokemonIDs[key];
        if (group.includes(originalPokemonID)) {
            sharedGroup = group;
            break;
        }
    }

    if (sharedGroup) {
        // Check if any instances in the shared group are registered
        let anyRegistered = instance.registered;

        Object.keys(ownershipData).forEach(key => {
            const otherInstance = ownershipData[key];

            // Skip the current instance
            if (otherInstance === instance) {
                return;
            }

            // Check if the other instance's pokemon_id is in the shared group
            if (sharedGroup.includes(otherInstance.pokemon_id)) {
                // Check if shiny, shadow, and costume_id match
                const shinyMatch = otherInstance.shiny === instance.shiny;
                const shadowMatch = otherInstance.shadow === instance.shadow;
                const costumeMatch = otherInstance.costume_id === instance.costume_id;

                if (shinyMatch && shadowMatch && costumeMatch) {
                    if (otherInstance.registered) {
                        anyRegistered = true;
                    }
                }
            }
        });

        // Set the `registered` status for the instance
        instance.registered = anyRegistered;

        // Update the `registered` status of other instances in the shared group
        if (anyRegistered) {
            Object.keys(ownershipData).forEach(key => {
                const otherInstance = ownershipData[key];

                // Skip if it's the same instance
                if (otherInstance === instance) {
                    return;
                }

                // Check if the other instance's pokemon_id is in the shared group
                if (sharedGroup.includes(otherInstance.pokemon_id)) {
                    // Check if shiny, shadow, and costume_id match
                    const shinyMatch = otherInstance.shiny === instance.shiny;
                    const shadowMatch = otherInstance.shadow === instance.shadow;
                    const costumeMatch = otherInstance.costume_id === instance.costume_id;

                    if (shinyMatch && shadowMatch && costumeMatch) {
                        otherInstance.registered = true;
                    }
                }
            });
        }
    }
}