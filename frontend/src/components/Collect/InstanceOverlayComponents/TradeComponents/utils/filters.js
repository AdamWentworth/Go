// filters.js

export const communityDayFilter = (pokemonList) => {
    return Object.fromEntries(
        Object.entries(pokemonList).filter(([key, details]) => 
            !(details.shiny_rarity === 'community_day' 
                && 
              (details.variantType === 'shiny' || details.variantType === 'default')
            )
        )
    );
};

export const researchDayFilter = (pokemonList) => {
    return Object.fromEntries(
        Object.entries(pokemonList).filter(([key, details]) => 
            !(details.shiny_rarity === 'research_day' 
                && 
              (details.variantType === 'shiny' || details.variantType === 'default')
            )
        )
    );
};

export const raidDayFilter = (pokemonList) => {
    return Object.fromEntries(
        Object.entries(pokemonList).filter(([key, details]) => 
            !(details.shiny_rarity === 'raid_day' 
                && 
              (details.variantType === 'shiny' || details.variantType === 'default')
            )
        )
    );
};

export const legendaryMythicalUltraBeastRaidFilter = (pokemonList) => {
    const excludedRarities = ['legendary_raid', 'mythical_raid', 'ultra_beast_raid'];
    
    return Object.fromEntries(
        Object.entries(pokemonList).filter(([key, details]) => 
            !(excludedRarities.includes(details.shiny_rarity)
            &&
            (details.variantType === 'shiny' || details.variantType === 'default'))
        )
    );
};

export const megaRaidFilter = (pokemonList) => {
    return Object.fromEntries(
        Object.entries(pokemonList).filter(([key, details]) => 
            !(details.shiny_rarity === 'mega_raid'
                && 
              (details.variantType === 'shiny' || details.variantType === 'default')
            )
        )
    );
};

export const permaboostedFilter = (pokemonList) => {
    return Object.fromEntries(
        Object.entries(pokemonList).filter(([key, details]) => 
            !(details.shiny_rarity === 'permaboosted'
                && 
              (details.variantType === 'shiny' || details.variantType === 'default')
            )
        )
    );
};

export const shinyIconFilter = (pokemonList) => {
    return Object.fromEntries(
        Object.entries(pokemonList).filter(([key, details]) => 
            details.variantType && details.variantType.toLowerCase().includes('shiny')
        )
    );
};

export const costumeIconFilter = (pokemonList) => {
    return Object.fromEntries(
        Object.entries(pokemonList).filter(([key, details]) => 
            details.variantType && details.variantType.toLowerCase().includes('costume')
        )
    );
};

export const legendaryIconFilter = (pokemonList) => {
    return Object.fromEntries(
        Object.entries(pokemonList).filter(([key, details]) => 
            details.rarity && 
            (details.rarity.toLowerCase().includes('legendary') || 
             details.rarity.toLowerCase().includes('ultra beast'))
        )
    );
};

export const regionalIconFilter = (pokemonList) => {
    return Object.fromEntries(
        Object.entries(pokemonList).filter(([key, details]) => 
            details.rarity && details.rarity.toLowerCase().includes('regional')
        )
    );
};

export const locationIconFilter = (pokemonList) => {
    return Object.fromEntries(
        Object.entries(pokemonList).filter(([key, details]) => 
            details.location_card !== null
        )
    );
};

// Add other filters here as needed for each image

const filters = [
    communityDayFilter,  // Index 0 corresponds to the Community Day image
    researchDayFilter,   // Index 1 corresponds to the Field Research image
    raidDayFilter,       // Index 2 corresponds to the Raid Day image
    legendaryMythicalUltraBeastRaidFilter,  // Index 3 corresponds to the Legendary/Mythical/Ultra Beast Raid image
    megaRaidFilter,      // Index 4 corresponds to the Mega Raid image
    permaboostedFilter,  // Index 5 corresponds to the Permaboosted image
    shinyIconFilter,     // Index 6 corresponds to the Shiny Icon image
    costumeIconFilter,   // Index 7 corresponds to the Costume Icon image
    legendaryIconFilter, // Index 8 corresponds to the Legendary Icon image
    regionalIconFilter,  // Index 9 corresponds to the Regional Icon image
    locationIconFilter,  // Index 10 corresponds to the Location Icon image
];

export default filters;