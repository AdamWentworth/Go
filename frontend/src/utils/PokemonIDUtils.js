// PokemonIDUtils.js
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export function generateUUID() {
    return uuidv4();
}

export function validateUUID(uuid) {
    return uuidValidate(uuid);
}

export function getKeyParts(key) {
    const parts = {
        pokemonId: parseInt(key.split('-')[0]),
        costumeName: null,
        isShiny: key.includes("_shiny") || key.includes("-shiny"),
        isDefault: key.includes("_default") || key.includes("-default"),
        isShadow: key.includes("_shadow") || key.includes("-shadow")
    };

    let costumeSplit = key.split('-')[1];
    if (costumeSplit) {
        if (parts.isShiny) {
            costumeSplit = costumeSplit.split('_shiny')[0];
        } else if (parts.isDefault) {
            costumeSplit = costumeSplit.split('_default')[0];
        } else if (parts.isShadow) {
            costumeSplit = costumeSplit.split('_shadow')[0];
        }
        parts.costumeName = costumeSplit;
    }
    return parts;
}

export function parsePokemonKey(pokemonKey) {
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

