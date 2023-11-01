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