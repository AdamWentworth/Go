export function determinePokemonImage(pokemon, isShiny, showShadow, costume) {
    let baseObject = costume || pokemon;

    if (isShiny && showShadow) {
        return baseObject.shiny_shadow_image;
    } else if (isShiny) {
        return baseObject.shiny_image;
    } else if (showShadow) {
        return baseObject.shadow_image;
    }
    return baseObject.image;
}

export function determinePokemonKey(pokemon, isShiny, showShadow) {
    const apexSuffix = pokemon.shadow_apex === 1 ? `-apex` : `-default`;
    const costumeSuffix = pokemon.currentCostumeName ? `-${pokemon.currentCostumeName}` : '';
    const shinySuffix = isShiny ? `-shiny` : '';
    const shadowSuffix = showShadow ? `-shadow` : '';

    let pokemonKey = `${pokemon.pokemon_id}${shinySuffix}${shadowSuffix}${apexSuffix}${costumeSuffix}`;

    return pokemonKey;
}
