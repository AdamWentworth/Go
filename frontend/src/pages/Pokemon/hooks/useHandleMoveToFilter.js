// useHandleMoveToFilter.js

import { useCallback } from 'react';
import { parsePokemonKey } from '../../../utils/PokemonIDUtils';
import { useModal } from '../../../contexts/ModalContext';

import {
  getStatusFromInstance,
  getTransitionMessage,
} from '../utils/transitionMessages';

function useHandleMoveToFilter({
  setOwnershipFilter,
  setHighlightedCards,
  highlightedCards,
  updateOwnership,
  variants,
  ownershipData,
  setIsUpdating,
  promptMegaPokemonSelection,
  promptFusionPokemonSelection,
  setIsFastSelectEnabled,
}) {
  const { confirm, alert } = useModal();

  const handleMoveHighlightedToFilter = useCallback(
    async (filter, cardsToMove) => {
      // console.log('[useHandleMoveToFilter] Moving cards to filter:', filter);
      try {
        setIsUpdating(true);
        // Let the UI update before heavy processing
        await new Promise((resolve) => setTimeout(resolve, 0));

        if (cardsToMove.size > 0) {
          await updateOwnership([...cardsToMove], filter);
        }

        setHighlightedCards(new Set());
        setIsFastSelectEnabled(false);
        // If you want to auto-switch the UI filter after moving, you could:
        // setOwnershipFilter(filter);
      } catch (error) {
        console.error('Error updating ownership:', error);
      } finally {
        setIsUpdating(false);
      }
    },
    [updateOwnership, setHighlightedCards, setIsUpdating]
  );

  const handleConfirmMoveToFilter = useCallback(
    async (filter) => {
      // Create a displayFilter variable so that if filter is "Owned"
      // the user sees "Caught" in alerts and messages.
      const displayFilter = filter === 'Owned' ? 'Caught' : filter;

      const messageDetails = [];
      let remainingHighlightedCards = new Set(highlightedCards);

      // We'll categorize the highlighted cards
      const megaPokemonKeys = [];
      const fusionPokemonKeys = [];
      const regularPokemonKeys = [];

      // --- 1) Sort out Mega, Fusion, or regular ---
      for (const pokemonKey of highlightedCards) {
        const parsed = parsePokemonKey(pokemonKey);
        if (!parsed) {
          console.warn(`Invalid pokemonKey format: ${pokemonKey}`);
          continue;
        }

        const { baseKey } = parsed;

        // Mega check
        if (
          baseKey.includes('_mega') ||
          baseKey.includes('-mega') ||
          baseKey.includes('_primal') ||
          baseKey.includes('-primal')
        ) {
          // If it specifically includes "mega_x" or "mega_y", store that
          let megaForm;
          if (baseKey.includes('mega_x')) megaForm = 'X';
          else if (baseKey.includes('mega_y')) megaForm = 'Y';

          megaPokemonKeys.push({ key: pokemonKey, baseKey, megaForm });
        }
        // Fusion check
        else if (baseKey.includes('fusion')) {
          fusionPokemonKeys.push({ key: pokemonKey, baseKey });
        }
        // Regular
        else {
          regularPokemonKeys.push({ key: pokemonKey, parsed });
        }
      }

      // --- 2) If the user is moving to Trade or Wanted, block Mega or Fusion ---
      const isTradeOrWanted = filter === 'Trade' || filter === 'Wanted';

      // Check for fused instances when moving to 'Unowned'
      if (filter === 'Unowned') {
        const fusedInstances = [];
        for (const pokemonKey of highlightedCards) {
          const instance = ownershipData[pokemonKey];
          if (instance && instance.is_fused) {
            fusedInstances.push(pokemonKey);
          }
        }
        if (fusedInstances.length > 0) {
          const fusedMsg = fusedInstances
            .map((key) => {
              const instance = ownershipData[key];
              return `• ${
                instance?.nickname ||
                getDisplayName(parsePokemonKey(key)?.baseKey, variants) ||
                key
              } is fused. Please unfuse before transferring.`;
            })
            .join('\n');

          await alert(fusedMsg);
          return; // Stop the transfer process if any fused Pokémon are detected
        }
      }

      // Block Mega or Fusion if moving to Trade/Wanted
      if (isTradeOrWanted && megaPokemonKeys.length > 0) {
        const blockedMegaMsg = megaPokemonKeys
          .map(({ key }) => {
            const instance = ownershipData[key];
            return `• ${
              instance?.nickname ||
              getDisplayName(parsePokemonKey(key)?.baseKey, variants) ||
              key
            } (Mega) cannot be moved to ${displayFilter}.`;
          })
          .join('\n');

        await alert(blockedMegaMsg);
        return; // Stop entire operation
      }

      if (isTradeOrWanted && fusionPokemonKeys.length > 0) {
        const blockedFusionMsg = fusionPokemonKeys
          .map(({ key }) => {
            const instance = ownershipData[key];
            return `• ${
              instance?.nickname ||
              getDisplayName(parsePokemonKey(key)?.baseKey, variants) ||
              key
            } (Fusion) cannot be moved to ${displayFilter}.`;
          })
          .join('\n');

        await alert(blockedFusionMsg);
        return; // Stop entire operation
      }

      // --- 3) Prompt for user’s choice if we have any Mega or Fusion Pokémon ---
      const skippedMegaPokemonKeys = [];
      const skippedFusionPokemonKeys = [];

      // 3(a) Handle Mega Pokémon
      if (megaPokemonKeys.length > 0) {
        for (const { key: pokemonKey, baseKey, megaForm } of megaPokemonKeys) {
          try {
            const result = await promptMegaPokemonSelection(baseKey, megaForm);
            if (result === 'assignExisting' || result === 'createNew') {
              remainingHighlightedCards.delete(pokemonKey);
            } else {
              skippedMegaPokemonKeys.push(baseKey);
              remainingHighlightedCards.delete(pokemonKey);
            }
          } catch (error) {
            console.error(`Error handling Mega Pokémon (${baseKey}):`, error);
            skippedMegaPokemonKeys.push(baseKey);
            remainingHighlightedCards.delete(pokemonKey);
          }
        }
      }

      // 3(b) Handle Fusion Pokémon
      if (fusionPokemonKeys.length > 0) {
        for (const { key: pokemonKey, baseKey } of fusionPokemonKeys) {
          try {
            const result = await promptFusionPokemonSelection(baseKey);
            if (
              result === 'fuseThis' ||
              result === 'assignFusion' ||
              result === 'createNew'
            ) {
              remainingHighlightedCards.delete(pokemonKey);
            } else {
              skippedFusionPokemonKeys.push(baseKey);
              remainingHighlightedCards.delete(pokemonKey);
            }
          } catch (error) {
            console.error(`Error handling Fusion Pokémon (${baseKey}):`, error);
            skippedFusionPokemonKeys.push(baseKey);
            remainingHighlightedCards.delete(pokemonKey);
          }
        }
      }

      // --- 4) Build the summary message for Regular Pokémon moves ---
      for (const { key: pokemonKey, parsed } of regularPokemonKeys) {
        const { baseKey, hasUUID } = parsed;
        const instance = ownershipData[pokemonKey];

        if (hasUUID && instance) {
          // (NEW) Use our helper to get the 'from' status:
          const currentStatus = getStatusFromInstance(instance);
          const displayName =
            instance.nickname || getDisplayName(baseKey, variants);

          // (NEW) Use our dictionary-based message generator:
          const actionDetail = getTransitionMessage(
            currentStatus,
            displayFilter,
            displayName
          );

          messageDetails.push(actionDetail);
        } else {
          // If there's no instance, it implies a new record
          const displayName = getDisplayName(baseKey, variants);
          const actionDetail = `Generate ${displayName} from Pokédex to ${displayFilter}`;
          messageDetails.push(actionDetail);
        }
      }

      // --- 5) Ask user to confirm any Regular Pokémon moves ---
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
        if (userConfirmed) {
          // Proceed with the move
          handleMoveHighlightedToFilter(filter, remainingHighlightedCards).catch(
            (error) => {
              console.error('Error during ownership update:', error);
              alert(
                'An error occurred while updating ownership. Please try again.'
              );
            }
          );
        } else {
          // User canceled
          console.log('User canceled the operation.');
        }
      } else {
        // If there's nothing to confirm, just move the remaining
        handleMoveHighlightedToFilter(filter, remainingHighlightedCards);
      }

      // --- 6) Show messages if we skipped any Mega or Fusion Pokémon ---
      if (skippedMegaPokemonKeys.length > 0) {
        const skippedMessage = `Skipped handling of Mega Pokémon with baseKey(s): ${skippedMegaPokemonKeys.join(
          ', '
        )}`;
        console.log(skippedMessage);
        await alert(skippedMessage);
      }

      if (skippedFusionPokemonKeys.length > 0) {
        const skippedMessage = `Skipped handling of Fusion Pokémon with baseKey(s): ${skippedFusionPokemonKeys.join(
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
      confirm,
      alert,
      handleMoveHighlightedToFilter,
      promptMegaPokemonSelection,
      promptFusionPokemonSelection,
    ]
  );

  return {
    handleConfirmMoveToFilter,
  };
}

// (Unchanged) Helper function to get display name
function getDisplayName(baseKey, variants) {
  const variant = variants.find((v) => v.pokemonKey === baseKey);
  return variant?.name || baseKey;
}

export default useHandleMoveToFilter;
