import { useState, useEffect } from 'react';
import { getPokemons } from '../../utils/api';

const useFetchPokemons = () => {
  const [allPokemons, setAllPokemons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPokemons()
      .then(data => {
        setAllPokemons(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching the Pokémon data: ", error);
        setLoading(false);
      });
  }, []);

  return { allPokemons, loading };
};

export default useFetchPokemons;
