// useHandleChangeTags.ts

import { useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useModal } from '../../../../../contexts/ModalContext';

import { getStatusFromInstance, getTransitionMessage } from '../utils/transitionMessages';
import { buildInstanceTagChangeMessage } from '../utils/buildInstanceTagChangeMessage';

import type { PokemonInstance } from '../../../../../types/pokemonInstance';
import type { PokemonVariant } from '../../../../../types/pokemonVariants';
import type { InstanceStatus } from '@/types/instances';

import { categorizePokemonKeys } from '../logic/categorizePokemonKeys';
import { validateBlockedMoves } from '../logic/validateMoveToFilter';
import { getDisplayName } from '../logic/getDisplayName';

interface useHandleChangeTagsProps {
  setTagFilter: (filter: InstanceStatus) => void;
  setLastMenu: (menu: string) => void; // ensure header switches to TAGS sublabel
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

// Normalize legacy labels to current canonical ones.
function normalizeStatus(status: string | InstanceStatus): InstanceStatus {
  const s = String(status || '').trim().toLowerCase();
  switch (s) {
    case 'owned':
    case 'caught':
      return 'Caught' as InstanceStatus;
    case 'trade':
      return 'Trade' as InstanceStatus;
    case 'wanted':
      return 'Wanted' as InstanceStatus;
    case 'unowned':
    case 'missing':
      return 'Missing' as InstanceStatus;
    default:
      return s as InstanceStatus;
  }
}

// Ensures the spinner renders before heavy work begins.
async function yieldToPaint() {
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

function useHandleChangeTags({
  setTagFilter,
  setLastMenu,
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
        const targetFilter = normalizeStatus(filter);

        // Commit spinner immediately so it can paint
        flushSync(() => setIsUpdating(true));
        await yieldToPaint();

        if (cardsToMove.size > 0) {
          await updateInstanceStatus([...cardsToMove], targetFilter);
        }

        // Reflect the new context in UI (don’t jump to Missing)
        if (targetFilter !== 'Missing') {
          setTagFilter(targetFilter);
          setLastMenu('ownership');
        }

        setHighlightedCards(new Set());
        setIsFastSelectEnabled(false);
      } catch (error) {
        console.error('Error updating instance:', error);
      } finally {
        setIsUpdating(false);
      }
    },
    [updateInstanceStatus, setHighlightedCards, setIsFastSelectEnabled, setIsUpdating, setTagFilter, setLastMenu]
  );

  const handleConfirmChangeTags = useCallback(
    async (filter: InstanceStatus) => {
      const targetFilter = normalizeStatus(filter);
      const displayFilterText = targetFilter; // already normalized
      const messageDetails: string[] = [];

      const { regular, mega, fusion } = categorizePokemonKeys(highlightedCards);

      const validation = validateBlockedMoves({
        filter: targetFilter,
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
      const remainingHighlightedCards = new Set(highlightedCards);

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
          // 🔧 Fix: Resolve name via the instance’s variant_id (not the parsed baseKey which can be empty for UUIDs)
          const instance = instances[key];
          const nameKey = instance?.variant_id || baseKey || '';
          const displayName =
            instance?.nickname || getDisplayName(nameKey, variants);

          const currentStatus = instance
            ? getStatusFromInstance(instance)
            : ('Missing' as InstanceStatus);

          const actionDetail = getTransitionMessage(currentStatus, targetFilter, displayName);
          messageDetails.push(actionDetail);
        } else {
          // Base key without UUID
          const displayName = getDisplayName(baseKey, variants);
          messageDetails.push(`Generate ${displayName} from Pokédex to ${displayFilterText}`);
        }
      }

      if (messageDetails.length > 0) {
        const messageContent = buildInstanceTagChangeMessage(messageDetails);
        const userConfirmed = await confirm(messageContent);

        if (userConfirmed) {
          handleMoveHighlightedToFilter(targetFilter, remainingHighlightedCards).catch((error) => {
            console.error('Error during instance update:', error);
            alert('An error occurred while updating instance. Please try again.');
          });
        } else {
          console.log('User canceled the operation.');
        }
      } else {
        handleMoveHighlightedToFilter(targetFilter, remainingHighlightedCards);
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
