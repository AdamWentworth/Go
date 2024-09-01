// filters.js

const filters = {
    communityDayFilter: (pokemonList, isWantedDetails) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => {
                const condition = details.shiny_rarity === 'community_day' && 
                                  (details.variantType === 'shiny' || details.variantType === 'default');
                return isWantedDetails ? condition : !condition;
            })
        );
    },

    researchDayFilter: (pokemonList, isWantedDetails) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => {
                const condition = details.shiny_rarity === 'research_day' && 
                                  (details.variantType === 'shiny' || details.variantType === 'default');
                return isWantedDetails ? condition : !condition;
            })
        );
    },

    raidDayFilter: (pokemonList, isWantedDetails) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => {
                const condition = details.shiny_rarity === 'raid_day' && 
                                  (details.variantType === 'shiny' || details.variantType === 'default');
                return isWantedDetails ? condition : !condition;
            })
        );
    },

    legendaryMythicalUltraBeastRaidFilter: (pokemonList, isWantedDetails) => {
        const excludedRarities = ['legendary_raid', 'mythical_raid', 'ultra_beast_raid'];

        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => {
                const condition = excludedRarities.includes(details.shiny_rarity) &&
                                  (details.variantType === 'shiny' || details.variantType === 'default');
                return isWantedDetails ? condition : !condition;
            })
        );
    },

    megaRaidFilter: (pokemonList, isWantedDetails) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => {
                const condition = details.shiny_rarity === 'mega_raid' &&
                                  (details.variantType === 'shiny' || details.variantType === 'default');
                return isWantedDetails ? condition : !condition;
            })
        );
    },

    permaboostedFilter: (pokemonList, isWantedDetails) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => {
                const condition = details.shiny_rarity === 'permaboosted' &&
                                  (details.variantType === 'shiny' || details.variantType === 'default');
                return isWantedDetails ? condition : !condition;
            })
        );
    },

    shinyIconFilter: (pokemonList, isWantedDetails) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => {
                const condition = details.variantType && details.variantType.toLowerCase().includes('shiny');
                return isWantedDetails ? !condition : condition;
            })
        );
    },

    costumeIconFilter: (pokemonList, isWantedDetails) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => {
                const condition = details.variantType && details.variantType.toLowerCase().includes('costume');
                return isWantedDetails ? !condition : condition;
            })
        );
    },

    legendaryIconFilter: (pokemonList, isWantedDetails) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => {
                const condition = details.rarity &&
                                  (details.rarity.toLowerCase().includes('legendary') ||
                                   details.rarity.toLowerCase().includes('ultra beast'));
                return isWantedDetails ? !condition : condition;
            })
        );
    },

    regionalIconFilter: (pokemonList, isWantedDetails) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => {
                const condition = details.rarity && details.rarity.toLowerCase().includes('regional');
                return isWantedDetails ? !condition : condition;
            })
        );
    },

    locationIconFilter: (pokemonList, isWantedDetails) => {
        return Object.fromEntries(
            Object.entries(pokemonList).filter(([key, details]) => {
                const condition = details.location_card !== null;
                return isWantedDetails ? !condition : condition;
            })
        );
    },
};

export default filters;
