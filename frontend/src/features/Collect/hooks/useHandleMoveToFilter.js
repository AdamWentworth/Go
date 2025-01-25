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
  promptFusionPokemonSelection, // <--- ADD this function to handle Fusion logic
}) {
  const { confirm, alert } = useModal();

  const handleMoveHighlightedToFilter = useCallback(
    async (filter, cardsToMove) => {
      try {
        setIsUpdating(true);
        // Let the UI update before heavy processing
        await new Promise((resolve) => setTimeout(resolve, 0));

        if (cardsToMove.size > 0) {
          await updateOwnership([...cardsToMove], filter);
        }

        setHighlightedCards(new Set());
        // If you want to auto-switch the UI filter after moving, you could:
        // setOwnershipFilter(filter);
      } catch (error) {
        console.error('Error updating ownership:', error);
      } finally {
        setIsUpdating(false);
      }
    },
    [updateOwnership, setHighlightedCards, setIsUpdating]
    // (If you want to auto-switch filters, add setOwnershipFilter to the dependency array above)
  );

  const handleConfirmMoveToFilter = useCallback(
    async (filter) => {
      const messageDetails = [];
      let remainingHighlightedCards = new Set(highlightedCards);

      // We'll categorize the highlighted cards
      const megaPokemonKeys = [];
      const fusionPokemonKeys = []; // <--- NEW array for Fusion
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

      // NEW: Check for fused instances when moving to 'Unowned'
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

      // --- 2) If the user is moving to Trade or Wanted, block Mega, or Fusion ---
      if (isTradeOrWanted && megaPokemonKeys.length > 0) {
        const blockedMegaMsg = megaPokemonKeys
          .map(({ key }) => {
            const instance = ownershipData[key];
            return `• ${
              instance?.nickname ||
              getDisplayName(parsePokemonKey(key)?.baseKey, variants) ||
              key
            } (Mega) cannot be moved to ${filter}.`;
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
            } (Fusion) cannot be moved to ${filter}.`;
          })
          .join('\n');

        await alert(blockedFusionMsg);
        return; // Stop entire operation
      }

      // --- 3) Prompt for user’s choice if we have any Mega or Fusion Pokémon ---
      // We do them separately. Let's store skipped keys in arrays to show the user later.
      const skippedMegaPokemonKeys = [];
      const skippedFusionPokemonKeys = [];

      // 3(a) Handle Mega Pokémon (only if not blocked above)
      if (megaPokemonKeys.length > 0) {
        console.log('Handling Mega Pokémon...');
        for (const { key: pokemonKey, baseKey, megaForm } of megaPokemonKeys) {
          try {
            console.log('Handling Mega Pokémon with baseKey:', baseKey, 'and megaForm:', megaForm);

            // We'll call the external function you provided:
            const result = await promptMegaPokemonSelection(baseKey, megaForm);

            if (result === 'assignExisting' || result === 'createNew') {
              // Remove from the set so we don't handle it again
              remainingHighlightedCards.delete(pokemonKey);
              console.log(`Successfully handled Mega Pokémon: ${baseKey}`);
            } else {
              // If the user canceled or something else, skip it
              skippedMegaPokemonKeys.push(baseKey);
              console.log(`Skipped Mega Pokémon: ${baseKey}`);
              remainingHighlightedCards.delete(pokemonKey);
            }
          } catch (error) {
            console.error(`Error handling Mega Pokémon (${baseKey}):`, error);
            skippedMegaPokemonKeys.push(baseKey);
            remainingHighlightedCards.delete(pokemonKey);
          }
        }
      }

      // 3(b) Handle Fusion Pokémon (only if not blocked above)
      if (fusionPokemonKeys.length > 0) {
        console.log('Handling Fusion Pokémon...');
        for (const { key: pokemonKey, baseKey } of fusionPokemonKeys) {
          try {
            console.log('Handling Fusion Pokémon with baseKey:', baseKey);

            // We'll call a new function you pass in, similar to promptMegaPokemonSelection:
            const result = await promptFusionPokemonSelection(baseKey);

            // Suppose you return either 'fuseThis', 'cancel', or similar
            if (result === 'fuseThis' || result === 'assignFusion' || result === 'createNew') {
              remainingHighlightedCards.delete(pokemonKey);
              console.log(`Successfully handled Fusion Pokémon: ${baseKey}`);
            } else {
              skippedFusionPokemonKeys.push(baseKey);
              console.log(`Skipped Fusion Pokémon: ${baseKey}`);
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
          // If there's no instance, it implies we're adding brand-new ownership from the Pokedex
          const displayName = getDisplayName(baseKey, variants);
          const actionDetail = `Generate ${displayName} from Pokédex to ${filter}`;
          messageDetails.push(actionDetail);
        }
      }

      // --- 5) Confirmation for Regular Pokémon moves ---
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

// Helper function to get display name
function getDisplayName(baseKey, variants) {
  const variant = variants.find((v) => v.pokemonKey === baseKey);
  return variant?.name || baseKey;
}

export default useHandleMoveToFilter;
