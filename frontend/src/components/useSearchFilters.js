import { useState } from 'react';

const useSearchFilters = () => {
    const [isShiny, setIsShiny] = useState(false);
    const [showShadow, setShowShadow] = useState(false);
    const [selectedGeneration, setSelectedGeneration] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCostume, setShowCostume] = useState(false);

    const generations = ["Kanto", "Johto", "Hoenn", "Sinnoh", "Unova", "Kalos", "Alola", "Galar", "Hisui", "Paldea"];
    const pokemonTypes = [
            "fire", "water", "grass", "electric", "psychic", "ice", "dragon", "dark", 
            "fairy", "normal", "fighting", "flying", "poison", "ground", "rock", 
            "bug", "ghost", "steel"
        ];

    const isTypeSearch = pokemonTypes.includes(searchTerm.toLowerCase());
    const isGenerationSearch = generations.some(gen => gen.toLowerCase() === searchTerm.toLowerCase());

    return {
        isShiny, setIsShiny, showShadow, setShowShadow, 
        selectedGeneration, setSelectedGeneration, searchTerm, setSearchTerm,
        showCostume, setShowCostume, generations, pokemonTypes,
        isTypeSearch, isGenerationSearch
    };
}

export default useSearchFilters;
