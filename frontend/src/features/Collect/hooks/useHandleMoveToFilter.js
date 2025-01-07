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
        if (filter !== "Unowned") {
          setOwnershipFilter(filter);
        }
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
      const shadowPokemonKeys = []; // Added for Shadow Pokémon
      const skippedMegaPokemonKeys = [];
      const regularPokemonKeys = [];
      let remainingHighlightedCards = new Set(highlightedCards);

      // First pass: Separate Mega and Shadow Pokémon from regular Pokémon
      for (const pokemonKey of highlightedCards) {
        const parsed = parsePokemonKey(pokemonKey);
        if (!parsed) {
          console.warn(`Invalid pokemonKey format: ${pokemonKey}`);
          continue;
        }

        const { baseKey } = parsed;
        let megaForm = undefined;

        if (baseKey.includes('_mega') || baseKey.includes('-mega')) {
          if (baseKey.includes('mega_x')) {
            megaForm = 'X';
          } else if (baseKey.includes('mega_y')) {
            megaForm = 'Y';
          }
          megaPokemonKeys.push({ key: pokemonKey, baseKey, megaForm });
        } else if (baseKey.includes('shadow')) { // Detect Shadow Pokémon
          shadowPokemonKeys.push({ key: pokemonKey, baseKey });
        } else {
          regularPokemonKeys.push({ key: pokemonKey, parsed });
        }
      }

      // **New Section: Early Check for Mega and Shadow Pokémon in "Trade" or "Wanted" Filters**
      const isTradeOrWanted = filter === 'Trade' || filter === 'Wanted';

      // Handle Mega Pokémon early interruption
      if (isTradeOrWanted && megaPokemonKeys.length > 0) {
        // Construct alert message listing all Mega Pokémon
        const megaMessages = megaPokemonKeys.map(({ key }) => {
          const instance = ownershipData[key];
          const displayName = instance?.nickname || getDisplayName(parsePokemonKey(key)?.baseKey, variants) || key;
          return `• ${displayName} cannot be moved to ${filter} as it is a Mega Pokémon.`;
        }).join('\n');

        // Log the blocking reason
        console.log(`Move to ${filter} blocked due to Mega Pokémon: ${megaPokemonKeys.map(mp => mp.key).join(', ')}`);

        // Show alert to the user
        await alert(megaMessages);

        // Interrupt the function
        return;
      }

      // Handle Shadow Pokémon early interruption
      if (isTradeOrWanted && shadowPokemonKeys.length > 0) {
        // Construct alert message listing all Shadow Pokémon
        const shadowMessages = shadowPokemonKeys.map(({ key }) => {
          const instance = ownershipData[key];
          const displayName = instance?.nickname || getDisplayName(parsePokemonKey(key)?.baseKey, variants) || key;
          return `• ${displayName} cannot be moved to ${filter} as it is a Shadow Pokémon.`;
        }).join('\n');

        // Log the blocking reason
        console.log(`Move to ${filter} blocked due to Shadow Pokémon: ${shadowPokemonKeys.map(sp => sp.key).join(', ')}`);

        // Show alert to the user
        await alert(shadowMessages);

        // Interrupt the function
        return;
      }
      // **End of New Section**

      // Process regular Pokémon first
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

      // Handle Mega Pokémon after regular Pokémon (if not interrupted)
      if (megaPokemonKeys.length > 0) {
        console.log('Handling Mega Pokémon...');
        for (const { key: pokemonKey, baseKey, megaForm } of megaPokemonKeys) {
          try {
            console.log('Handling Mega Pokémon with baseKey:', baseKey, 'and megaForm:', megaForm);
            const result = await promptMegaPokemonSelection(baseKey, megaForm);

            if (result === 'assignExisting' || result === 'createNew') {
              remainingHighlightedCards.delete(pokemonKey);
              console.log(`Successfully handled Mega Pokémon: ${baseKey}`);
            } else {
              skippedMegaPokemonKeys.push(baseKey);
              console.log(`Skipped Mega Pokémon: ${baseKey}`);
              // Remove the skipped mega key from remaining cards
              remainingHighlightedCards.delete(pokemonKey);
            }
          } catch (error) {
            console.error(`Error handling Mega Pokémon (${baseKey}):`, error);
            skippedMegaPokemonKeys.push(baseKey);
            console.log(`Skipped Mega Pokémon: ${baseKey}`);
            // Remove the errored mega key from remaining cards
            remainingHighlightedCards.delete(pokemonKey);
          }
        }
      }

      // Show confirmation dialog for remaining Pokémon
      if (messageDetails.length > 0) {
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
          console.log('Proceeding to move highlighted cards to filter.');
          handleMoveHighlightedToFilter(filter, remainingHighlightedCards).catch((error) => {
            console.error('Error during ownership update:', error);
            alert('An error occurred while updating ownership. Please try again.');
          });
        } else {
          console.log('User canceled the operation.');
        }
      } else {
        handleMoveHighlightedToFilter(filter, remainingHighlightedCards);
      }

      // Show skipped Mega Pokémon message at the end if any were skipped
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
