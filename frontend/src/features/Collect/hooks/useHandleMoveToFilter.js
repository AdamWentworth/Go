// useHandleMoveToFilter.js

import { useCallback } from 'react';
import { parsePokemonKey } from '../../../utils/PokemonIDUtils'; // Adjust the import path as needed
import { useModal } from '../../../contexts/ModalContext'; // Adjust the import path as needed

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
    async (filter) => {
      try {
        setIsUpdating(true);

        // Wait for React to process the state update
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Proceed with the update
        await updateOwnership([...highlightedCards], filter);

        setHighlightedCards(new Set());

        setOwnershipFilter(filter);
      } catch (error) {
        console.error('Error updating ownership:', error);
      } finally {
        setIsUpdating(false);
      }
    },
    [
      highlightedCards,
      updateOwnership,
      setHighlightedCards,
      setOwnershipFilter,
      setIsUpdating,
    ]
  );

  const handleConfirmMoveToFilter = useCallback(
    async (filter) => {
      const messageDetails = [];
      const megaPokemonKeys = [];
      const skippedMegaPokemonKeys = []; // To track canceled Mega Pokémon

      // Separate Mega Pokémon and regular Pokémon
      for (const pokemonKey of highlightedCards) {
        const parsed = parsePokemonKey(pokemonKey);
        if (!parsed) {
          console.warn(`Invalid pokemonKey format: ${pokemonKey}`);
          continue;
        }

        const { baseKey } = parsed;

        // Check for Mega Pokémon
        if (baseKey.includes('_mega') || baseKey.includes('-mega')) {
          console.log(`Detected Mega Pokémon: ${baseKey}`);
          megaPokemonKeys.push(baseKey);
        } else {
          // Regular Pokémon processing
          const instance = ownershipData[baseKey];
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
              const variant = variants.find((v) => v.pokemonKey === baseKey);
              displayName = variant ? variant.name : 'Unknown Pokémon';
              console.log(`Determined displayName: ${displayName}`);
            }

            const actionDetail = `Move ${displayName} from ${currentStatus} to ${filter}`;
            if (!messageDetails.includes(actionDetail)) {
              messageDetails.push(actionDetail);
              console.log(`Added actionDetail: ${actionDetail}`);
            }
          } else {
            console.warn(
              `No instance found for baseKey=${baseKey}. Treating as unknown Pokémon.`
            );
            const actionDetail = `Move unknown Pokémon from Unknown to ${filter}`;
            messageDetails.push(actionDetail);
            console.log(
              `Added actionDetail for unknown Pokémon: ${actionDetail}`
            );
          }
        }
      }

      // Handle Mega Pokémon
      if (megaPokemonKeys.length > 0) {
        console.log('Handling Mega Pokémon...');
        for (const megaKey of megaPokemonKeys) {
          try {
            console.log('Handling Mega Pokémon with baseKey:', megaKey);
            // Prompt the user via modal
            await promptMegaPokemonSelection(megaKey);
            console.log(`Successfully handled Mega Pokémon: ${megaKey}`);
          } catch (error) {
            console.error(`Error handling Mega Pokémon (${megaKey}):`, error);
            // Track skipped Mega Pokémon keys
            skippedMegaPokemonKeys.push(megaKey);
            console.log(`Skipped Mega Pokémon: ${megaKey}`);
          }
        }
      }

      // If there are regular Pokémon to process, show the confirmation dialog
      if (messageDetails.length > 0) {
        const maxDetails = 10; // Maximum number of details to show in modal
        const hasMore = messageDetails.length > maxDetails;
        const displayedDetails = hasMore
          ? messageDetails.slice(0, maxDetails)
          : messageDetails;

        const additionalCount = hasMore ? messageDetails.length - maxDetails : 0;

        const summaryMessage = `Are you sure you want to make the following changes?`;

        // Create the list items
        const detailsList = displayedDetails.map((detail, index) => (
          <li key={index}>{detail}</li>
        ));

        // If there are more items, add a summary line
        if (hasMore) {
          detailsList.push(
            <li key="more">...and {additionalCount} more items</li>
          );
        }

        // Prepare the message as React nodes
        const messageContent = (
          <>
            <p>{summaryMessage}</p>
            <ul>
              {detailsList}
            </ul>
          </>
        );

        const userConfirmed = await confirm(messageContent);
        console.log('User confirmed:', userConfirmed);

        if (userConfirmed) {
          console.log(
            'User confirmed. Proceeding to move highlighted cards to filter.'
          );
          handleMoveHighlightedToFilter(filter).catch((error) => {
            console.error('Error during ownership update:', error);
            alert(
              'An error occurred while updating ownership. Please try again.'
            );
          });
        } else {
          console.log('User canceled the operation.');
        }
      } else {
        console.log('No regular Pokémon to process in ownership filter.');
      }

      // Optionally, notify the user about skipped Mega Pokémon
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
    ]
  );

  return {
    handleConfirmMoveToFilter,
  };
}

export default useHandleMoveToFilter;
