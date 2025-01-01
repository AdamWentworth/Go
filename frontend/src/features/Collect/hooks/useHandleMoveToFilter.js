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
        // Optionally, handle errors here (e.g., show a notification to the user)
      }
    },
    [highlightedCards, updateOwnership, setHighlightedCards, setOwnershipFilter]
  );

  const handleConfirmMoveToFilter = useCallback(
    (filter) => {
      // Construct the confirmation message
      const messageDetails = [];

      highlightedCards.forEach((pokemonKey) => {
        const instance = ownershipData[pokemonKey];
        if (instance) {
          const currentStatus = instance.is_unowned
            ? 'Unowned'
            : instance.is_owned
            ? 'Owned'
            : instance.is_for_trade
            ? 'For Trade'
            : instance.is_wanted
            ? 'Wanted'
            : 'Unknown';

          // Determine display name
          let displayName = instance.nickname;
          if (!displayName) {
            const keyParts = pokemonKey.split('_');
            keyParts.pop(); // Remove the UUID part
            const basePrefix = keyParts.join('_'); // Rejoin to form the actual prefix
            const variant = variants.find((v) => v.pokemonKey === basePrefix);
            displayName = variant ? variant.name : 'Unknown Pokémon';
          }

          const actionDetail = `Move ${displayName} from ${currentStatus} to ${filter}`;
          if (!messageDetails.includes(actionDetail)) {
            messageDetails.push(actionDetail);
          }
        } else {
          // Handle the case where the pokemonKey does not have corresponding ownership data
          const actionDetail = `Move unknown Pokémon from Unknown to ${filter}`;
          messageDetails.push(actionDetail);
        }
      });

      const detailedMessage = `Are you sure you want to make the following changes?\n\n${messageDetails.join(
        '\n'
      )}`;

      // Display the confirmation dialog
      const userConfirmed = window.confirm(detailedMessage);

      if (userConfirmed) {
        // Execute the ownership update
        handleMoveHighlightedToFilter(filter).catch((error) => {
          console.error('Error during ownership update:', error);
          // Optionally, inform the user about the error
          window.alert('An error occurred while updating ownership. Please try again.');
        });
      }
    },
    [highlightedCards, ownershipData, variants, handleMoveHighlightedToFilter]
  );

  return {
    handleConfirmMoveToFilter,
  };
}

export default useHandleMoveToFilter;
