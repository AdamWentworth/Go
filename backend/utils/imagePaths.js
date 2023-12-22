const getImagePathsForPokemon = (pokemon) => {
    let type1Icon = pokemon.type1_name ? `/images/types/${pokemon.type1_name.toLowerCase()}.png` : null;
    let type2Icon = pokemon.type2_name ? `/images/types/${pokemon.type2_name.toLowerCase()}.png` : null;

    return {
        ...pokemon,
        type_1_icon: type1Icon,
        type_2_icon: type2Icon,
    };
};

module.exports = {
    getImagePathsForPokemon,
};
