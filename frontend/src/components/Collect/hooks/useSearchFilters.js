//useSearchFilters.js

import { useState, useEffect } from 'react';
import { generations, pokemonTypes } from '../utils/constants'; // Import the required functions and arrays
import { handleSearchTermChange } from '../utils/searchFunctions';


const useSearchFilters = (allPokemons) => {
    const [isShiny, setIsShiny] = useState(false);
    const [showShadow, setShowShadow] = useState(false);
    const [selectedGeneration, setSelectedGeneration] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCostume, setShowCostume] = useState(false);

    const isTypeSearch = pokemonTypes.includes(searchTerm.toLowerCase());
    const isGenerationSearch = generations.some(gen => gen.toLowerCase() === searchTerm.toLowerCase());

    const [filteredPokemonList, setFilteredPokemonList] = useState(allPokemons); 

    useEffect(() => {
        handleSearchTermChange(allPokemons, searchTerm, generations, pokemonTypes, setFilteredPokemonList);
    }, [searchTerm, allPokemons, setFilteredPokemonList]);    

    return {
        isShiny, setIsShiny, showShadow, setShowShadow, 
        selectedGeneration, setSelectedGeneration, searchTerm, setSearchTerm,
        showCostume, setShowCostume, generations, pokemonTypes,
        isTypeSearch, isGenerationSearch,
        filteredPokemonList // Include the filtered list in the return
    };
}

export default useSearchFilters;