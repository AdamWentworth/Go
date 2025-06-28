// useHandleChangeTags.ts

import { useCallback } from 'react';
import { useModal } from '../../../../../contexts/ModalContext.jsx';

import { getStatusFromInstance, getTransitionMessage } from '../utils/transitionMessages.js';
import { buildInstanceTagChangeMessage } from '../utils/buildInstanceTagChangeMessage.js';

import { PokemonInstance } from '../../../../../types/pokemonInstance.js';
import { PokemonVariant } from '../../../../../types/pokemonVariants.js';
import type { InstanceStatus } from '@/types/instances';

import { categorizePokemonKeys } from '../logic/categorizePokemonKeys.js';
import { validateBlockedMoves } from '../logic/validateMoveToFilter.js';
import { getDisplayName } from '../logic/getDisplayName.js';

interface useHandleChangeTagsProps {
  setTagFilter: (filter: InstanceStatus) => void;
  setHighlightedCards: (cards: Set<string>) => void;
  highlightedCards: Set<string>;
  updateInstanceStatus: (keys: string[], filter: InstanceStatus) => Promise<void>;
  variants: PokemonVariant[];
  instances: Record<string, PokemonInstance>;
  setIsUpdating: (value: boolean) => void;
  promptMegaPokemonSelection: (baseKey: string, megaForm?: string) => Promise<string>;
  promptFusionPokemonSelection: (baseKey: string) => Promise<string>;
  setIsFastSelectEnabled: (enabled: boolean) => void;
}

function useHandleChangeTags({
  setTagFilter,
  setHighlightedCards,
  highlightedCards,
  updateInstanceStatus,
  variants,
  instances,
  setIsUpdating,
  promptMegaPokemonSelection,
  promptFusionPokemonSelection,
  setIsFastSelectEnabled,
}: useHandleChangeTagsProps) {
  const { confirm, alert } = useModal();

  const handleMoveHighlightedToFilter = useCallback(
    async (filter: InstanceStatus, cardsToMove: Set<string>) => {
      try {
        setIsUpdating(true);
        await new Promise((resolve) => setTimeout(resolve, 0));
        if (cardsToMove.size > 0) {
          await updateInstanceStatus([...cardsToMove], filter);
        }
        if (filter !== 'Unowned') {
          setTagFilter(filter);
        }
        setHighlightedCards(new Set());
        setIsFastSelectEnabled(false);
      } catch (error) {
        console.error('Error updating instance:', error);
      } finally {
        setIsUpdating(false);
      }
    },
    [updateInstanceStatus, setHighlightedCards, setIsFastSelectEnabled, setIsUpdating, setTagFilter]
  );

  const handleConfirmChangeTags = useCallback(
    async (filter: InstanceStatus) => {
      const displayFilterText = filter === 'Owned' ? 'Caught' : filter;
      const messageDetails: string[] = [];

      const { regular, mega, fusion } = categorizePokemonKeys(highlightedCards);

      const validation = validateBlockedMoves({
        filter,
        fusionKeys: fusion,
        megaKeys: mega,
        instances,
        displayFilterText,
        variants,
      });

      if (!validation.success && validation.message) {
        await alert(validation.message);
        return;
      }

      const skippedMegaPokemonKeys: string[] = [];
      const skippedFusionPokemonKeys: string[] = [];
      let remainingHighlightedCards = new Set(highlightedCards);

      for (const { key, baseKey, megaForm } of mega) {
        try {
          const result = await promptMegaPokemonSelection(baseKey, megaForm);
          if (result !== 'assignExisting' && result !== 'createNew') {
            skippedMegaPokemonKeys.push(baseKey);
          }
          remainingHighlightedCards.delete(key);
        } catch (error) {
          console.error(`Error handling Mega Pokémon (${baseKey}):`, error);
          skippedMegaPokemonKeys.push(baseKey);
          remainingHighlightedCards.delete(key);
        }
      }

      for (const { key, baseKey } of fusion) {
        try {
          const result = await promptFusionPokemonSelection(baseKey);
          if (
            result !== 'fuseThis' &&
            result !== 'assignFusion' &&
            result !== 'createNew'
          ) {
            skippedFusionPokemonKeys.push(baseKey);
          }
          remainingHighlightedCards.delete(key);
        } catch (error) {
          console.error(`Error handling Fusion Pokémon (${baseKey}):`, error);
          skippedFusionPokemonKeys.push(baseKey);
          remainingHighlightedCards.delete(key);
        }
      }

      for (const { key, parsed } of regular) {
        const { baseKey, hasUUID } = parsed;
      
        if (hasUUID) {
          // Only access instances if hasUUID is true
          const instance = instances[key];
          if (instance) {
            const currentStatus = getStatusFromInstance(instance);
            const displayName = instance.nickname || getDisplayName(baseKey, variants);
            const actionDetail = getTransitionMessage(currentStatus, filter, displayName);
            messageDetails.push(actionDetail);
          } else {
            // Handle unexpected missing instance data gracefully
            console.warn(`Missing instance data for key: ${key}`);
            const displayName = getDisplayName(baseKey, variants);
            messageDetails.push(`Generate ${displayName} from Pokédex to ${displayFilterText}`);
          }
        } else {
          // Base key without UUID, handle safely without accessing instances
          const displayName = getDisplayName(baseKey, variants);
          messageDetails.push(`Generate ${displayName} from Pokédex to ${displayFilterText}`);
        }
      }      

      if (messageDetails.length > 0) {
        const messageContent = buildInstanceTagChangeMessage(messageDetails);
        const userConfirmed = await confirm(messageContent);

        if (userConfirmed) {
          
          handleMoveHighlightedToFilter(filter, remainingHighlightedCards).catch((error) => {
            console.error('Error during instance update:', error);
            alert('An error occurred while updating instance. Please try again.');
          });
        } else {
          console.log('User canceled the operation.');
        }
      } else {
        handleMoveHighlightedToFilter(filter, remainingHighlightedCards);
      }

      if (skippedMegaPokemonKeys.length > 0) {
        const names = skippedMegaPokemonKeys.map((key) => getDisplayName(key, variants));
        const msg = `Skipped handling of Mega Pokémon: ${names.join(', ')}`;
        console.log(msg);
        await alert(msg);
      }
      
      if (skippedFusionPokemonKeys.length > 0) {
        const names = skippedFusionPokemonKeys.map((key) => getDisplayName(key, variants));
        const msg = `Skipped handling of Fusion Pokémon: ${names.join(', ')}`;
        console.log(msg);
        await alert(msg);
      }      
    },
    [
      highlightedCards,
      instances,
      variants,
      confirm,
      alert,
      handleMoveHighlightedToFilter,
      promptMegaPokemonSelection,
      promptFusionPokemonSelection,
    ]
  );

  return {
    handleConfirmChangeTags,
  };
}

export default useHandleChangeTags;
