// tradeFilters.js

const filters = {
    communityDayFilter: (pokemonList) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => 
                details.shiny_rarity === 'community_day' 
                    && 
                (details.variantType === 'shiny' || details.variantType === 'default')
            )
        );
    },

    researchDayFilter: (pokemonList) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => 
                details.shiny_rarity === 'research_day' 
                    && 
                (details.variantType === 'shiny' || details.variantType === 'default')
            )
        );
    },

    raidDayFilter: (pokemonList) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => 
                details.shiny_rarity === 'raid_day' 
                    && 
                (details.variantType === 'shiny' || details.variantType === 'default')
            )
        );
    },

    legendaryMythicalUltraBeastRaidFilter: (pokemonList) => {
        const includedRarities = ['legendary_raid', 'mythical_raid', 'ultra_beast_raid'];
        
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => 
                includedRarities.includes(details.shiny_rarity)
                &&
                (details.variantType === 'shiny' || details.variantType === 'default')
            )
        );
    },

    megaRaidFilter: (pokemonList) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => 
                details.shiny_rarity === 'mega_raid'
                    && 
                (details.variantType === 'shiny' || details.variantType === 'default')
            )
        );
    },

    permaboostedFilter: (pokemonList) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => 
                details.shiny_rarity === 'permaboosted'
                    && 
                (details.variantType === 'shiny' || details.variantType === 'default')
            )
        );
    },

    shinyIconFilter: (pokemonList) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => 
                !(details.variantType && details.variantType.toLowerCase().includes('shiny'))
            )
        );
    },

    costumeIconFilter: (pokemonList) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => 
                !(details.variantType && details.variantType.toLowerCase().includes('costume'))
            )
        );
    },

    legendaryIconFilter: (pokemonList) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => 
                !(details.rarity && 
                (details.rarity.toLowerCase().includes('legendary') || 
                details.rarity.toLowerCase().includes('ultra beast')))
            )
        );
    },

    regionalIconFilter: (pokemonList) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => 
                !(details.rarity && details.rarity.toLowerCase().includes('regional'))
            )
        );
    },

    locationIconFilter: (pokemonList) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => 
                details.location_card === null
            )
        );
    }
};

export default filters;
