// useHandleMoveToFilter.js

import { useCallback } from 'react';

function useHandleMoveToFilter({
  setOwnershipFilter,
  setHighlightedCards,
  highlightedCards,
  updateOwnership,
  variants,
  ownershipData,
  setIsUpdating,
}) {
  const handleMoveHighlightedToFilter = useCallback(
    async (filter) => {
      try {
        // Set loading state and wait for state update to be processed
        setIsUpdating(true);
        // Wait for React to process the state update
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Now proceed with the update
        await updateOwnership([...highlightedCards], filter);
        setHighlightedCards(new Set());
        setOwnershipFilter(filter);
      } catch (error) {
        console.error('Error updating ownership:', error);
      } finally {
        setIsUpdating(false);
      }
    },
    [highlightedCards, updateOwnership, setHighlightedCards, setOwnershipFilter, setIsUpdating]
  );

  const handleConfirmMoveToFilter = useCallback(
    (filter) => {
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

          let displayName = instance.nickname;
          if (!displayName) {
            const keyParts = pokemonKey.split('_');
            keyParts.pop();
            const basePrefix = keyParts.join('_');
            const variant = variants.find((v) => v.pokemonKey === basePrefix);
            displayName = variant ? variant.name : 'Unknown Pokémon';
          }

          const actionDetail = `Move ${displayName} from ${currentStatus} to ${filter}`;
          if (!messageDetails.includes(actionDetail)) {
            messageDetails.push(actionDetail);
          }
        } else {
          const actionDetail = `Move unknown Pokémon from Unknown to ${filter}`;
          messageDetails.push(actionDetail);
        }
      });

      const detailedMessage = `Are you sure you want to make the following changes?\n\n${messageDetails.join(
        '\n'
      )}`;

      const userConfirmed = window.confirm(detailedMessage);

      if (userConfirmed) {
        handleMoveHighlightedToFilter(filter).catch((error) => {
          console.error('Error during ownership update:', error);
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