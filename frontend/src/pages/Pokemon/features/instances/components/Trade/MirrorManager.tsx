// src/pages/Pokemon/features/instances/components/Trade/MirrorManager.tsx
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

import { createMirrorEntry } from '@/pages/Pokemon/features/instances/utils/createMirrorEntry';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';
import { createScopedLogger } from '@/utils/logger';

import './MirrorManager.css';

const log = createScopedLogger('MirrorManager');

type UpdateDetailsFn =
  | ((id: string, data: Partial<PokemonInstance>) => void)
  | ((patch: Record<string, Partial<PokemonInstance>>) => void);

type MirrorPokemon = Omit<Partial<PokemonVariant>, 'instanceData' | 'variant_id' | 'pokemon_id'> & {
  instanceData?: Partial<PokemonInstance> & {
    instance_id?: string;
    mirror?: boolean;
    variant_id?: string;
  };
  variant_id?: string;
  pokemon_id?: number | string;
  species_name?: string;
  currentImage?: string;
  pokedex_number?: number | string;
  date_available?: string;
  date_shiny_available?: string;
  date_shadow_available?: string;
  date_shiny_shadow_available?: string;
  variantType?: string;
  name?: string;
  image_url?: string;
};

interface MirrorManagerProps {
  pokemon: MirrorPokemon;
  instances?: Record<string, PokemonInstance>;
  lists: Record<string, Record<string, unknown>>;
  isMirror: boolean;
  setIsMirror: (value: boolean) => void;
  setMirrorKey: (key: string | null) => void;
  editMode: boolean; // mirrors parent isEditable
  updateDisplayedList: (data: Record<string, PokemonInstance>) => void;
  updateDetails: UpdateDetailsFn;
}

const asNumber = (value: unknown): number | undefined => {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

// Normalize legacy variant-id differences:
// 0006-shiny-gigantamax -> 0006-shiny_gigantamax
function normalizeVariantId(value?: string | null): string | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const separatorIndex = value.indexOf('-');
  if (separatorIndex < 0) return value.toLowerCase();
  const prefix = value.slice(0, separatorIndex);
  const suffix = value.slice(separatorIndex + 1).replace(/-/g, '_');
  return `${prefix}-${suffix}`.toLowerCase();
}

function getVariantId(pokemon: MirrorPokemon): string | undefined {
  return normalizeVariantId(pokemon.variant_id) ?? normalizeVariantId(pokemon.instanceData?.variant_id);
}

function safeUpdate(
  fn: UpdateDetailsFn,
  id: string,
  data: Partial<PokemonInstance>,
): void {
  try {
    if (fn.length >= 2) {
      (fn as (instanceId: string, patch: Partial<PokemonInstance>) => void)(id, data);
      return;
    }

    (fn as (patchMap: Record<string, Partial<PokemonInstance>>) => void)({ [id]: data });
  } catch (error) {
    log.warn('safeUpdate failed:', error);
  }
}

function enrichInstanceForDisplay(
  source: PokemonInstance,
  pokemon: MirrorPokemon,
): PokemonInstance {
  return {
    ...source,
    variantType: pokemon.variantType,
    pokedex_number: asNumber(pokemon.pokedex_number),
    currentImage: pokemon.currentImage ?? pokemon.image_url,
    name: pokemon.species_name ?? pokemon.name,
    date_available: pokemon.date_available,
    date_shiny_available: pokemon.date_shiny_available,
    date_shadow_available: pokemon.date_shadow_available,
    date_shiny_shadow_available: pokemon.date_shiny_shadow_available,
    costumes: pokemon.costumes,
    shiny_rarity: pokemon.shiny_rarity,
    rarity: pokemon.rarity,
  };
}

const MirrorManager: React.FC<MirrorManagerProps> = ({
  pokemon,
  instances,
  lists,
  isMirror,
  setIsMirror,
  setMirrorKey,
  editMode,
  updateDisplayedList,
  updateDetails,
}) => {
  const initialMount = useRef(true);
  const [hovered, setHovered] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const instanceMap: Record<string, PokemonInstance> = instances ?? {};

  useEffect(() => {
    if (!initialMount.current) return;

    initialMount.current = false;
    const currentMirror = !!pokemon.instanceData?.mirror;
    setIsMirror(currentMirror);

    if (currentMirror) {
      enableMirror();
    } else {
      disableMirror();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialMount.current || !editMode) return;

    const currentId = pokemon.instanceData?.instance_id;
    if (currentId) {
      safeUpdate(updateDetails, currentId, { mirror: isMirror });
    }

    if (isMirror) {
      enableMirror();
    } else {
      disableMirror();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMirror, editMode]);

  const enableMirror = (): void => {
    const existingMirrorKey = findExistingMirrorKey();
    if (existingMirrorKey) {
      setMirrorKey(existingMirrorKey);

      const source = instanceMap[existingMirrorKey];
      if (!source) {
        log.warn('Mirror key resolved but instance not found:', existingMirrorKey);
        updateDisplayedList({});
        return;
      }

      updateDisplayedList({
        [existingMirrorKey]: enrichInstanceForDisplay(source, pokemon),
      });
      return;
    }

    const newMirrorKey = createMirrorEntry(pokemon, instanceMap, lists, updateDetails);
    setMirrorKey(newMirrorKey);

    const source = instanceMap[newMirrorKey];
    if (!source) {
      log.warn('createMirrorEntry did not leave an instance in map for key:', newMirrorKey);
      updateDisplayedList({});
      return;
    }

    updateDisplayedList({
      [newMirrorKey]: enrichInstanceForDisplay(source, pokemon),
    });
  };

  const disableMirror = (): void => {
    setMirrorKey(null);
    updateDisplayedList({});
  };

  const toggleMirror = (): void => {
    if (editMode) {
      setIsMirror(!isMirror);
    }
  };

  /**
   * Find an existing mirror by exact variant_id (normalized)
   * and flags wanted/not-caught/not-trade. No base-prefix matching.
   */
  const findExistingMirrorKey = (): string | undefined => {
    const targetVariant = getVariantId(pokemon);
    const expectedPokemonId = asNumber(pokemon.pokemon_id);

    if (!targetVariant) {
      log.warn('No variant_id on pokemon; cannot find mirror.', pokemon);
      return undefined;
    }

    const found = Object.entries(instanceMap).find(([, inst]) => {
      const instanceVariant = normalizeVariantId(inst.variant_id);
      if (instanceVariant !== targetVariant) return false;

      const isWantedOnly = !!inst.is_wanted && !inst.is_caught && !inst.is_for_trade;
      if (!isWantedOnly) return false;

      const instancePokemonId = asNumber(inst.pokemon_id);
      if (
        expectedPokemonId != null &&
        instancePokemonId != null &&
        instancePokemonId !== expectedPokemonId
      ) {
        return false;
      }

      return true;
    });

    const foundKey = found?.[0];
    log.debug('findExistingMirrorKey:', foundKey || 'No key found', 'variant_id:', targetVariant);
    return foundKey;
  };

  const dynamicTooltipText = `Toggle Mirror<br>This will create or reference a "Wanted" Pokemon<br>Limiting your Wanted List to a <b><u>${pokemon.species_name ?? pokemon.name ?? 'this Pokemon'}</u></b> only`;

  const renderTooltip = () => {
    if (!hovered || !tooltipRef.current) return null;

    const rect = tooltipRef.current.getBoundingClientRect();
    const tooltipHeight = 50;
    const extraSpace = 30;

    return ReactDOM.createPortal(
      <div
        className="tooltip"
        style={{
          position: 'fixed',
          top: `${rect.top - tooltipHeight - extraSpace}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)',
          zIndex: 100000,
          backgroundColor: 'black',
          padding: '10px',
          color: 'white',
          whiteSpace: 'pre',
          borderRadius: '5px',
          textAlign: 'center',
          opacity: 0.9,
        }}
        dangerouslySetInnerHTML={{ __html: dynamicTooltipText }}
      />,
      document.body,
    );
  };

  return (
    <div
      className="mirror"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      ref={tooltipRef}
    >
      <img
        src="/images/mirror.png"
        alt="Mirror"
        className={isMirror ? '' : 'grey-out'}
        onClick={toggleMirror}
        style={{ cursor: editMode ? 'pointer' : 'default' }}
      />
      {renderTooltip()}
    </div>
  );
};

export default MirrorManager;
