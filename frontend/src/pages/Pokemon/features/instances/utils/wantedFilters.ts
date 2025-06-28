// wantedFilters.ts

interface PokemonDetails {
    shiny_rarity?: string;
    variantType?: string;
    rarity?: string;
    location_card?: string | null;
    // Add additional properties as needed.
}

type PokemonList = Record<string, PokemonDetails>;

const filters = {
communityDayFilter: (pokemonList: PokemonList): PokemonList =>
    Object.fromEntries(
    Object.entries(pokemonList).filter(([_key, details]) =>
        !(details.shiny_rarity === 'community_day' &&
        (details.variantType === 'shiny' || details.variantType === 'default'))
    )
    ),

researchDayFilter: (pokemonList: PokemonList): PokemonList =>
    Object.fromEntries(
    Object.entries(pokemonList).filter(([_key, details]) =>
        !(details.shiny_rarity === 'research_day' &&
        (details.variantType === 'shiny' || details.variantType === 'default'))
    )
    ),

raidDayFilter: (pokemonList: PokemonList): PokemonList =>
    Object.fromEntries(
    Object.entries(pokemonList).filter(([_key, details]) =>
        !(details.shiny_rarity === 'raid_day' &&
        (details.variantType === 'shiny' || details.variantType === 'default'))
    )
    ),

legendaryMythicalUltraBeastRaidFilter: (pokemonList: PokemonList): PokemonList => {
    const excluded = ['legendary_raid', 'mythical_raid', 'ultra_beast_raid'];
    return Object.fromEntries(
    Object.entries(pokemonList).filter(([_key, details]) =>
        !(excluded.includes(details.shiny_rarity ?? '') &&
        (details.variantType === 'shiny' || details.variantType === 'default'))
    )
    );
},

megaRaidFilter: (pokemonList: PokemonList): PokemonList =>
    Object.fromEntries(
    Object.entries(pokemonList).filter(([_key, details]) =>
        !(details.shiny_rarity === 'mega_raid' &&
        (details.variantType === 'shiny' || details.variantType === 'default'))
    )
    ),

permaboostedFilter: (pokemonList: PokemonList): PokemonList =>
    Object.fromEntries(
    Object.entries(pokemonList).filter(([_key, details]) =>
        !(details.shiny_rarity === 'permaboosted' &&
        (details.variantType === 'shiny' || details.variantType === 'default'))
    )
    ),

shinyIconFilter: (pokemonList: PokemonList): PokemonList =>
    Object.fromEntries(
    Object.entries(pokemonList).filter(([_key, details]) =>
        details.variantType?.toLowerCase().includes('shiny')
    )
    ),

costumeIconFilter: (pokemonList: PokemonList): PokemonList =>
    Object.fromEntries(
    Object.entries(pokemonList).filter(([_key, details]) =>
        details.variantType?.toLowerCase().includes('costume')
    )
    ),

legendaryIconFilter: (pokemonList: PokemonList): PokemonList =>
    Object.fromEntries(
    Object.entries(pokemonList).filter(([_key, details]) =>
        details.rarity != null &&
        (details.rarity.toLowerCase().includes('legendary') ||
        details.rarity.toLowerCase().includes('ultra beast'))
    )
    ),

regionalIconFilter: (pokemonList: PokemonList): PokemonList =>
    Object.fromEntries(
    Object.entries(pokemonList).filter(([_key, details]) =>
        details.rarity?.toLowerCase().includes('regional')
    )
    ),

locationIconFilter: (pokemonList: PokemonList): PokemonList =>
    Object.fromEntries(
    Object.entries(pokemonList).filter(([_key, details]) =>
        details.location_card != null
    )
    ),
};

export default filters;
