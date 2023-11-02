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