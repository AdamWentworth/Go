// contexts/Auth/sessionActions.js

import { useNavigate } from 'react-router-dom';
import { usePokemonData } from '../PokemonDataContext';

export const useSessionActions = (setIsLoggedIn, setUser, userRef, closeConnection) => {
  const navigate = useNavigate();
  const { resetData } = usePokemonData();

  const clearSession = async (isForcedLogout) => {
    localStorage.removeItem('user');
    localStorage.removeItem('pokemonOwnership');
    setIsLoggedIn(false);
    setUser(null);
    userRef.current = null;

    // Close SSE connection using closeConnection
    if (closeConnection) {
      closeConnection();
    }

    // Clear relevant caches
    if ('caches' in window) {
      try {
        const cache = await caches.open('pokemonCache');
        await cache.delete('/pokemonOwnership');
        await cache.delete('/pokemonLists');
      } catch (error) {
        console.error('Error clearing cache storage:', error);
      }
    }

    // Call resetData to clear and reinitialize the Pokemon data
    resetData();

    if (isForcedLogout) {
      navigate('/login', { replace: true });
      setTimeout(() => alert('Your session has expired, please log in again.'), 1000);
    } else {
      navigate('/login', { replace: true });
    }
  };

  return {
    clearSession,
  };
};
