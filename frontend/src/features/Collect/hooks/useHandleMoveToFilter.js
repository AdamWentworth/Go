// useHandleMoveToFilter.js

import { useCallback } from 'react';

function useHandleMoveToFilter({
    setOwnershipFilter,
    setHighlightedCards,
    highlightedCards,
    updateOwnership,
    variants,
    ownershipData,
  }) {

  // Make handleMoveHighlightedToFilter asynchronous
  const handleMoveHighlightedToFilter = useCallback(
      async (filter) => {
      try {
          // Await the completion of updateOwnership
          await updateOwnership([...highlightedCards], filter);
          // After updateOwnership completes, update the state
          setHighlightedCards(new Set());
          setOwnershipFilter(filter);
      } catch (error) {
          console.error('Error updating ownership:', error);
          // Handle errors as needed, e.g., show a notification to the user
      }
      },
      [highlightedCards, updateOwnership, setHighlightedCards, setOwnershipFilter]
  );

  // Modify handleConfirmMoveToFilter to handle the async function
  const handleConfirmMoveToFilter = useCallback(
    (filter) => {
      confirmMoveToFilter(
        // Pass the async callback
        async () => {
          await handleMoveHighlightedToFilter(filter);
        },
        filter,
        highlightedCards,
        variants,
        ownershipData
      );
    },
    [handleMoveHighlightedToFilter, highlightedCards, variants, ownershipData]
  );

  return {
      handleConfirmMoveToFilter,
    };
  }

  const confirmMoveToFilter = async (
    asyncMoveHighlightedToFilter, // Renamed for clarity
    filter,
    highlightedCards,
    Variants,
    ownershipData
  ) => {
    let messageDetails = []; // Details for dynamic confirmation message
  
    highlightedCards.forEach((pokemonKey) => {
      const instance = ownershipData[pokemonKey];
      // First check if the instance exists in the ownership data
      if (instance) {
        let currentStatus = instance.is_unowned
          ? 'Unowned'
          : instance.is_owned
          ? 'Owned'
          : instance.is_for_trade
          ? 'For Trade'
          : instance.is_wanted
          ? 'Wanted'
          : 'Unknown';
  
        // Handle nickname or find variant name
        let displayName = instance.nickname; // First try to use the nickname
        if (!displayName) {
          // If no nickname, derive the name from the variants
          let keyParts = pokemonKey.split('_');
          keyParts.pop(); // Remove the UUID part
          let basePrefix = keyParts.join('_'); // Rejoin to form the actual prefix
          const variant = Variants.find((v) => v.pokemonKey === basePrefix);
          displayName = variant ? variant.name : 'Unknown Pokémon'; // Use variant name if available
        }
  
        let actionDetail = `Move ${displayName} from ${currentStatus} to ${filter}`;
        if (!messageDetails.includes(actionDetail)) {
          messageDetails.push(actionDetail);
        }
      } else {
        // Handle the case where the pokemonKey does not have corresponding ownership data
        let actionDetail = `Move unknown Pokémon from Unknown to ${filter}`;
        messageDetails.push(actionDetail);
      }
    });
  
    let detailedMessage = `Are you sure you want to make the following changes?\n\n${messageDetails.join(
      '\n'
    )}`;
    
    const userConfirmed = window.confirm(detailedMessage);
    
    if (userConfirmed) {
      try {
        // Await the asynchronous callback
        await asyncMoveHighlightedToFilter(filter);
      } catch (error) {
        console.error('Error during moveHighlightedToFilter:', error);
        // Optionally, inform the user about the error
        window.alert('An error occurred while updating ownership. Please try again.');
      }
    }
  };
    

export default useHandleMoveToFilter;