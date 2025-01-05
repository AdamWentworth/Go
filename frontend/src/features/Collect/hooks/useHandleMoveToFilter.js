// useHandleMoveToFilter.js

import { useCallback } from 'react';
import { parsePokemonKey } from '../../../utils/PokemonIDUtils';
import { useModal } from '../../../contexts/ModalContext';

function useHandleMoveToFilter({
  setOwnershipFilter,
  setHighlightedCards,
  highlightedCards,
  updateOwnership,
  variants,
  ownershipData,
  setIsUpdating,
  promptMegaPokemonSelection,
}) {
  const { confirm, alert } = useModal();

  const handleMoveHighlightedToFilter = useCallback(
    async (filter, cardsToMove) => {
      try {
        setIsUpdating(true);
        await new Promise((resolve) => setTimeout(resolve, 0));
        if (cardsToMove.size > 0) {
          await updateOwnership([...cardsToMove], filter);
        }
        setHighlightedCards(new Set());
        setOwnershipFilter(filter);
      } catch (error) {
        console.error('Error updating ownership:', error);
      } finally {
        setIsUpdating(false);
      }
    },
    [updateOwnership, setHighlightedCards, setOwnershipFilter, setIsUpdating]
  );

  const handleConfirmMoveToFilter = useCallback(
    async (filter) => {
      const messageDetails = [];
      const megaPokemonKeys = [];
      const skippedMegaPokemonKeys = [];
      const regularPokemonKeys = [];
      let cardsToMove = new Set();

      // First pass: Separate Mega Pokemon from regular Pokemon
      for (const pokemonKey of highlightedCards) {
        const parsed = parsePokemonKey(pokemonKey);
        if (!parsed) {
          console.warn(`Invalid pokemonKey format: ${pokemonKey}`);
          continue;
        }

        const { baseKey } = parsed;
        if (baseKey.includes('_mega') || baseKey.includes('-mega')) {
          megaPokemonKeys.push({ key: pokemonKey, baseKey });
        } else {
          regularPokemonKeys.push({ key: pokemonKey, parsed });
          cardsToMove.add(pokemonKey); // Add regular Pokemon by default
        }
      }

      // Handle Mega Pokémon first
      if (megaPokemonKeys.length > 0) {
        console.log('Handling Mega Pokémon...');
        for (const { key: pokemonKey, baseKey } of megaPokemonKeys) {
          try {
            console.log('Handling Mega Pokémon with baseKey:', baseKey);
            const result = await promptMegaPokemonSelection(baseKey);
            // Only add to cardsToMove if mega evolution was successful
            if (result === 'assignExisting' || result === 'createNew') {
              cardsToMove.add(pokemonKey);
              console.log(`Successfully handled Mega Pokémon: ${baseKey}`);
            } else {
              skippedMegaPokemonKeys.push(baseKey);
              console.log(`Skipped Mega Pokémon: ${baseKey}`);
            }
          } catch (error) {
            console.error(`Error handling Mega Pokémon (${baseKey}):`, error);
            skippedMegaPokemonKeys.push(baseKey);
            console.log(`Skipped Mega Pokémon: ${baseKey}`);
          }
        }
      }

      // Process regular Pokémon for message details
      for (const { key: pokemonKey, parsed } of regularPokemonKeys) {
        const { baseKey, hasUUID } = parsed;

        if (hasUUID) {
          const instance = ownershipData[pokemonKey];
          if (!instance) {
            console.warn(`No instance found for UUID: ${pokemonKey}`);
            continue;
          }

          const currentStatus = instance.is_unowned
            ? 'Unowned'
            : instance.is_for_trade
            ? 'For Trade'
            : instance.is_wanted
            ? 'Wanted'
            : instance.is_owned
            ? 'Owned'
            : 'Unknown';

          const displayName = instance.nickname || getDisplayName(baseKey, variants);
          const actionDetail = `Move ${displayName} from ${currentStatus} to ${filter}`;
          
          if (!messageDetails.includes(actionDetail)) {
            messageDetails.push(actionDetail);
          }
        } else {
          const displayName = getDisplayName(baseKey, variants);
          const actionDetail = `Generate ${displayName} from Pokédex to ${filter}`;
          messageDetails.push(actionDetail);
        }
      }

      // Show confirmation dialog if there are any cards to move
      if (cardsToMove.size > 0 && messageDetails.length > 0) {
        const maxDetails = 10;
        const hasMore = messageDetails.length > maxDetails;
        const displayedDetails = hasMore
          ? messageDetails.slice(0, maxDetails)
          : messageDetails;

        const additionalCount = hasMore ? messageDetails.length - maxDetails : 0;
        const summaryMessage = `Are you sure you want to make the following changes?`;
        const detailsList = displayedDetails.map((detail, index) => (
          <li key={index}>{detail}</li>
        ));

        if (hasMore) {
          detailsList.push(
            <li key="more">...and {additionalCount} more items</li>
          );
        }

        const messageContent = (
          <>
            <p>{summaryMessage}</p>
            <ul>{detailsList}</ul>
          </>
        );

        const userConfirmed = await confirm(messageContent);
        console.log('User confirmed:', userConfirmed);

        if (userConfirmed) {
          console.log('Proceeding to move cards to filter:', cardsToMove);
          handleMoveHighlightedToFilter(filter, cardsToMove).catch((error) => {
            console.error('Error during ownership update:', error);
            alert('An error occurred while updating ownership. Please try again.');
          });
        } else {
          console.log('User canceled the operation.');
        }
      }

      // Notify about skipped Mega Pokémon
      if (skippedMegaPokemonKeys.length > 0) {
        const skippedMessage = `Skipped handling of Mega Pokémon with baseKey(s): ${skippedMegaPokemonKeys.join(
          ', '
        )}`;
        console.log(skippedMessage);
        await alert(skippedMessage);
      }
    },
    [
      highlightedCards,
      ownershipData,
      variants,
      handleMoveHighlightedToFilter,
      promptMegaPokemonSelection,
      confirm,
      alert,
      setHighlightedCards,
    ]
  );

  return {
    handleConfirmMoveToFilter,
  };
}

// Helper function to get display name
function getDisplayName(baseKey, variants) {
  const variant = variants.find((v) => v.pokemonKey === baseKey);
  return variant?.name || baseKey;
}

export default useHandleMoveToFilter;