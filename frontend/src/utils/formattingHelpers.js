// formattingHelpers.js

export function formatPokemonName(name, form) {
    if (!form) return name;

    const formattedForm = formatForm(form); // Ensure form is formatted (e.g., "Alolan")
    const nameParts = name.split(' ');
    const specialModifiers = ['Shiny', 'Shadow'];

    // Find the position after the last special modifier (Shiny, Shadow)
    let insertPosition = nameParts.findIndex(part => !specialModifiers.includes(part));
    if (insertPosition === -1 || nameParts.length === 1) {
        // If no special modifiers are found or only one part exists, prepend the form
        insertPosition = 0;
    }

    // Insert the formatted form in the determined position
    nameParts.splice(insertPosition, 0, formattedForm);
    return nameParts.join(' ');
}

export function formatForm(form) {
    if (!form) return "";

    const words = form
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

    // If there are only 2 words, just return as they are already capitalized
    if (words.length === 2) {
        return words.join(' ');
    }

    return words.join(' ');
}

export function formatCostume(costume) {
    if (!costume || !costume.name) return "";

    const words = costume.name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

    return words.join(' ');
}


export function formatShinyRarity(rarity) {
    switch(rarity) {
        case "community_day":
            return "Community Day ~1/25";
        case "research_day":
            return "Research Day ~1/10";
        case "raid_day":
            return "Raid Day ~1/10";
        case "mega_raid":
            return "Mega Raid ~1/64";
        case "permaboosted":
            return "Permaboosted ~1/64";
        case "baby_boost":
            return "Egg ~1/64";
        case "hatch_day":
            return "Egg ~1/10";
        case "legendary_raid":
            return "Legendary Raid ~1/20";
        case "ultra_beast_raid":
            return "Ultra Beast Raid ~1/20";
        case "mythical_raid":
            return "Mythical Raid ~1/20";
        default:
            return "Full Odds ~1/500";
    }
}


export function formatShinyShadowRarity(rarity) {
    switch(rarity) {
        case "shadow_encounter":
            return "Rocket Boss ~1/64\nRocket Grunt or Shadow Raid ~1/256";
        case "legendary_raid":
            return "Shadow Raid ~1/20";
        default:
            return "Unavailable";
    }
}

export function formatCostumeName(name) {
    return name
        .replace(/_/g, ' ')
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function getLastWord(fullName) {
    return fullName.split(" ").pop();
  }


export function formatTimeAgo(timestamp) {
    const milliseconds = Date.now() - timestamp;
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} old`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} old`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} old`;
    } else {
        return `${seconds} second${seconds > 1 ? 's' : ''} old`;
    }
}

export function formatTimeUntil(timestamp) {
    const milliseconds = timestamp - Date.now();
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
        return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }
}

export const generateH2Content = (pokemon, multiFormPokedexNumbers, showAll) => {
    const nickname = pokemon.ownershipStatus?.nickname;
    if (nickname && nickname.trim()) {
        return nickname;
    }

    let contentParts = [];

    const isMegaVariant = (pokemon.variantType && pokemon.variantType.includes('mega')) || pokemon.ownershipStatus?.is_mega;

    // Handle Shiny if it's part of the costume name
    let isShiny = false;
    let costumeName = '';

    if (pokemon.currentCostumeName && !isMegaVariant) {
        costumeName = formatCostumeName(pokemon.currentCostumeName);
        if (costumeName.toLowerCase().includes('shiny')) {
            isShiny = true;
            costumeName = costumeName.replace(/shiny/i, '').trim();
            if (costumeName) {
                contentParts.push(costumeName);
            }
        } else {
            contentParts.push(costumeName);
        }
    }

    // Determine the Pokémon name with form if applicable
    let nameText = pokemon.name;
    const hasMultiFormPokedexNumbers = Array.isArray(multiFormPokedexNumbers) && multiFormPokedexNumbers.length > 0;
    const shouldIncludeForm = !isMegaVariant && pokemon.form && pokemon.form !== 'Average' && 
        (!hasMultiFormPokedexNumbers || !multiFormPokedexNumbers.includes(pokemon.pokedex_number) || showAll);

    if (shouldIncludeForm) {
        nameText = formatPokemonName(pokemon.name, pokemon.form);
    }

    // Remove 'Shiny' from the start of the name if it exists
    if (nameText.toLowerCase().startsWith('shiny ')) {
        isShiny = true;
        nameText = nameText.substring(6);
    }

    // Construct content parts with guaranteed order
    contentParts = [];
    if (isShiny) {
        contentParts.push('Shiny');
    }

    contentParts.push(nameText);

    // Rest of the existing logic remains the same...
    if (pokemon.ownershipStatus?.is_mega && !contentParts.includes('Mega')) {
        contentParts.unshift('Mega');
    }

    if (pokemon.ownershipStatus?.is_mega && pokemon.ownershipStatus.mega_form != null) {
        contentParts.push(pokemon.ownershipStatus.mega_form);
    }

    if (pokemon.ownershipStatus?.is_fused && pokemon.ownershipStatus.fusion_form) {
        contentParts.pop(nameText);
        contentParts.push(pokemon.ownershipStatus.fusion_form);
        if (pokemon.ownershipStatus.shiny) {
            isShiny = true;
        }
    }

    if (pokemon.ownershipStatus?.purified) {
        contentParts = contentParts.map(part => part.replace(/shadow/gi, '').trim())
                                   .filter(part => part.length > 0);

        if (!contentParts.some(part => part.toLowerCase() === 'purified')) {
            contentParts.unshift('Purified');
        }
    }

    return (
        <>
            {contentParts.map((part, index) => (
                <span key={index} className="pokemon-detail">{part} </span>
            ))}
        </>
    );
};