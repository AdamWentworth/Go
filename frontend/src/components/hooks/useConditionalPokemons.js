// useConditionalPokemons.js

import useShowAllPokemons from './modes/useShowAllPokemons';
import useFilterPokemons from './modes/useFilterPokemons';

const useConditionalPokemons = (allPokemons, filters, showEvolutionaryLine, showAll) => {
  // const allPokemonsData = useShowAllPokemons(allPokemons, filters, showEvolutionaryLine);
  const filteredPokemonsData = useFilterPokemons(allPokemons, filters, showEvolutionaryLine);

  return filteredPokemonsData;
};

export default useConditionalPokemons;
