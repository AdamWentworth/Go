// src/hooks/useUserDataLoader.js

import { useEffect } from 'react';

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
  useEffect(() => {
    if (isUsernamePath && username) {
      // Prevent API call for non-username paths
      if (
        ['collect', 'discover', 'login', 'register', 'account'].includes(
          username.toLowerCase()
        )
      ) {
        // Invalid username, do not fetch
        setUserExists(false);
        setViewedOwnershipData(null);
        return;
      }

      const ownershipStatus = location.state?.ownershipStatus;

      if (ownershipStatus) {
        setOwnershipFilter(ownershipStatus);
        fetchUserOwnershipData(
          username,
          setOwnershipFilter,
          setShowAll,
          ownershipStatus
        );
      } else {
        fetchUserOwnershipData(username, setOwnershipFilter, setShowAll);
      }
    } else if (!isUsernamePath) {
      // Viewing own collection
      setOwnershipFilter('');
      setShowAll(false);
      // No need to fetch data
    }
  }, [isUsernamePath, username]); // Only include necessary dependencies
}

export default useUserDataLoader;
