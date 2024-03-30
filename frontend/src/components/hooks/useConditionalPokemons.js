// useConditionalPokemons.js

import useShowAllPokemons from './useShowAllPokemons';
import useFilterPokemons from './useFilterPokemons';

const useConditionalPokemons = (allPokemons, filters, showEvolutionaryLine, showAll) => {
  const allPokemonsData = useShowAllPokemons(allPokemons, filters, showEvolutionaryLine);
  const filteredPokemonsData = useFilterPokemons(allPokemons, filters, showEvolutionaryLine);

  return showAll ? allPokemonsData : filteredPokemonsData;
};

export default useConditionalPokemons;
