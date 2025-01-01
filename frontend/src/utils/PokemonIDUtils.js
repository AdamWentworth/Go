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

export function determinePokemonKey(pokemon) {
    let suffix = '';

    // Check for a match with the standard image URLs
    if (pokemon.currentImage === pokemon.image_url) {
        suffix = '-default';
    } else if (pokemon.currentImage === pokemon.image_url_shadow) {
        suffix = '-shadow';
    } else if (pokemon.currentImage === pokemon.image_url_shiny) {
        suffix = '-shiny';
    } else if (pokemon.currentImage === pokemon.image_url_shiny_shadow) {
        suffix = '-shiny_shadow';
    }

    // Check for Mega, Shiny Mega, Primal, and Shiny Primal Evolutions
    if (pokemon.variantType) {
        if (pokemon.variantType.startsWith('mega')) {
            suffix = `-${pokemon.variantType}`;
        } else if (pokemon.variantType.startsWith('shiny_mega')) {
            suffix = `-${pokemon.variantType}`;
        } else if (pokemon.variantType.startsWith('primal')) {
            suffix = `-${pokemon.variantType}`;
        } else if (pokemon.variantType.startsWith('shiny_primal')) {
            suffix = `-${pokemon.variantType}`;
        }
    }

    // Check for a match with costume image URLs
    if (pokemon.costumes) {
        pokemon.costumes.forEach(costume => {
            if (pokemon.currentImage === costume.image_url) {
                suffix = `-${costume.name}_default`;
            } else if (pokemon.currentImage === costume.image_url_shiny) {
                suffix = `-${costume.name}_shiny`;
            }

            // Additional checks for shadow costume images
            if (costume.shadow_costume) {
                if (pokemon.currentImage === costume.shadow_costume.image_url_shadow_costume) {
                    suffix = `-shadow_${costume.name}_default`;
                } else if (pokemon.currentImage === costume.shadow_costume.image_url_shiny_shadow_costume) {
                    suffix = `-shadow_${costume.name}_shiny`;
                }
            }
        });
    }

    // Pad pokemon_id with leading zeros based on its digit count
    let paddedPokemonId;
    const id = String(pokemon.pokemon_id);
    if (id.length === 1) {
        paddedPokemonId = `000${id}`;
    } else if (id.length === 2) {
        paddedPokemonId = `00${id}`;
    } else if (id.length === 3) {
        paddedPokemonId = `0${id}`;
    } else {
        // No padding needed for 4 or more digits
        paddedPokemonId = id;
    }

    // Construct the final pokemonKey with the padded pokemon_id and the determined suffix
    const pokemonKey = `${paddedPokemonId}${suffix}`;

    return pokemonKey;
}