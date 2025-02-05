// src/hooks/useUserDataLoader.js
import { useEffect, useRef } from 'react';

function useUserDataLoader({
  isUsernamePath,
  username,
  location,
  setUserExists,
  setViewedOwnershipData,
  setOwnershipFilter,
  setShowAll,
  fetchUserOwnershipData,
}) {
  // Keep track of last fetch params to avoid redundant calls
  const lastFetchedRef = useRef({ username: null, ownershipStatus: null });

  useEffect(() => {
    async function loadUserData() {
      if (!isUsernamePath || !username) {
        // When NOT viewing someone else's collection, reset
        setOwnershipFilter('');
        setShowAll(false);
        return;
      }

      // Don't fetch for reserved paths
      if (
        ['collect', 'discover', 'login', 'register', 'account', 'trades']
          .includes(username.toLowerCase())
      ) {
        setUserExists(false);
        setViewedOwnershipData(null);
        return;
      }

      // Pull ownership status from React Router location (if any)
      const ownershipStatus = location.state?.ownershipStatus || '';

      // Check if we're about to fetch the same combo again
      const combo = { username, ownershipStatus };
      const lastCombo = lastFetchedRef.current;
      if (
        lastCombo.username === combo.username &&
        lastCombo.ownershipStatus === combo.ownershipStatus
      ) {
        // Skip — we've already fetched for this exact combination
        return;
      }

      // Otherwise, record new combination and fetch
      lastFetchedRef.current = combo;

      // If we have an ownershipStatus, apply it; otherwise default
      let canonicalUsername;
      if (ownershipStatus) {
        setOwnershipFilter(ownershipStatus);
        canonicalUsername = await fetchUserOwnershipData(
          username,
          setOwnershipFilter,
          setShowAll,
          ownershipStatus
        );
      } else {
        canonicalUsername = await fetchUserOwnershipData(
          username,
          setOwnershipFilter,
          setShowAll
        );
      }

      // If the canonical username returned differs from URL, replace it
      if (canonicalUsername && canonicalUsername !== username) {
        window.history.replaceState(
          {},
          '',
          location.pathname.replace(username, canonicalUsername)
        );
      }
    }

    loadUserData();
    // Notice we keep the dependencies minimal — only what truly changes:
    // username, isUsernamePath, location, setOwnershipFilter, setShowAll, ...
  }, [
    isUsernamePath,
    username,
    location,
    setUserExists,
    setViewedOwnershipData,
    setOwnershipFilter,
    setShowAll,
    fetchUserOwnershipData,
  ]);
}

export default useUserDataLoader;
