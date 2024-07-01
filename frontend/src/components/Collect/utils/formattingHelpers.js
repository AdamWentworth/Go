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
        case "mega_raid":
            return "Mega Raid ~1/60";
        case "permaboosted":
            return "Permaboosted ~1/64";
        case "raid_day":
            return "Raid Day ~1/10";
        case "egg":
            return "Egg ~1/10 - 1/64";
        default:
            return "Full Odds ~1/500";
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
        return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
    } else {
        return `${seconds} second${seconds > 1 ? 's' : ''} remaining`;
    }
}
