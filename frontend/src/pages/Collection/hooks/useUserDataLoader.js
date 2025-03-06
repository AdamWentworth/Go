// src/hooks/useUserDataLoader.js
import { useEffect, useRef } from 'react';

function useUserDataLoader({
  isUsernamePath,
  username,
  location,
  setUserExists,
  setViewedOwnershipData,
  setOwnershipFilter,
  fetchUserOwnershipData,
}) {
  // Keep track of last fetch params to avoid redundant calls
  const lastFetchedRef = useRef({ username: null, ownershipStatus: null });

  // Separate effect for handling path/username changes
  useEffect(() => {
    if (!isUsernamePath || !username) {
      // Reset the ownership filter when the path or username changes
      setOwnershipFilter('');
    }
  }, [isUsernamePath, username, setOwnershipFilter]);

  // Main data loading effect
  useEffect(() => {
    async function loadUserData() {
      if (!isUsernamePath || !username) {
        return;
      }

      // Don't fetch for reserved paths
      if (
        ['collect', 'discover', 'login', 'register', 'account', 'trades'].includes(
          username.toLowerCase()
        )
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

      // Record the new combination and fetch data
      lastFetchedRef.current = combo;

      let canonicalUsername;
      if (ownershipStatus) {
        // Apply the ownership status filter from location state
        setOwnershipFilter(ownershipStatus);
        canonicalUsername = await fetchUserOwnershipData(
          username,
          setOwnershipFilter,
          ownershipStatus
        );
      } else {
        canonicalUsername = await fetchUserOwnershipData(username, setOwnershipFilter);
      }

      // If the canonical username returned differs from URL, update the URL accordingly
      if (canonicalUsername && canonicalUsername !== username) {
        window.history.replaceState(
          {},
          '',
          location.pathname.replace(username, canonicalUsername)
        );
      }
    }

    loadUserData();
  }, [
    isUsernamePath,
    username,
    location,
    setUserExists,
    setViewedOwnershipData,
    setOwnershipFilter,
    fetchUserOwnershipData,
  ]);
}

export default useUserDataLoader;
