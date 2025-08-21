// src/pages/Pokemon/features/instances/components/Trade/MirrorManager.tsx
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { createMirrorEntry } from '../../utils/createMirrorEntry';
import './MirrorManager.css';
import { PokemonVariant } from '@/types/pokemonVariants';
import { PokemonInstance } from '@/types/pokemonInstance';

interface MirrorManagerProps {
  pokemon: PokemonVariant & {
    instanceData?: Partial<PokemonInstance> & { instance_id?: string; mirror?: boolean; variant_id?: string };
    variant_id?: string;
    pokemon_id?: number | string;
    species_name?: string;
    currentImage?: string;
    pokedex_number?: number | string;
    date_available?: string;
    date_shiny_available?: string;
    date_shadow_available?: string;
    date_shiny_shadow_available?: string;
    costumes?: any;
    shiny_rarity?: any;
    rarity?: any;
    variantType?: string;
    name?: string;
    image_url?: string;
  };

  // Accept either prop name; we’ll use whichever is provided.
  instances?: Record<string, PokemonInstance>;
  ownershipData?: Record<string, PokemonInstance>;

  lists: any;
  isMirror: boolean;
  setIsMirror: (value: boolean) => void;
  setMirrorKey: (key: string | null) => void;
  editMode: boolean; // you pass isEditable here
  updateDisplayedList: (data: Record<string, PokemonInstance>) => void;

  // Store updater; supports either (id, data) or ({ [id]: data })
  updateDetails: ((id: string, data: Partial<PokemonInstance>) => void) | ((patch: Record<string, Partial<PokemonInstance>>) => void);
}

/** Helper: best-effort numeric coercion */
const asNumber = (n: unknown) => {
  if (n == null) return undefined;
  const x = Number(n as any);
  return Number.isFinite(x) ? x : undefined;
};

/** Normalize legacy variant-id differences:
 *  - keep the first '-' (after the 4-digit id)
 *  - convert any remaining '-' in the suffix to '_'
 *  - lowercase everything
 *  Examples:
 *    0006-shiny-gigantamax -> 0006-shiny_gigantamax
 *    0006-default          -> 0006-default (unchanged)
 */
function normalizeVariantId(v?: string | null): string | undefined {
  if (!v || typeof v !== 'string') return undefined;
  const i = v.indexOf('-');
  if (i < 0) return v.toLowerCase();
  const prefix = v.slice(0, i);
  const suffix = v.slice(i + 1).replace(/-/g, '_');
  return `${prefix}-${suffix}`.toLowerCase();
}

/** Resolve the variant_id from the pokemon object */
function getVariantId(pokemon: MirrorManagerProps['pokemon']): string | undefined {
  return (
    normalizeVariantId((pokemon as any)?.variant_id) ||
    normalizeVariantId(pokemon?.instanceData?.variant_id)
  );
}

/** Unified safe update for either signature of updateDetails */
function safeUpdate(
  fn: MirrorManagerProps['updateDetails'],
  id: string,
  data: Partial<PokemonInstance>
) {
  try {
    if (typeof fn !== 'function') return;
    if ((fn as any).length >= 2) {
      (fn as (id: string, data: Partial<PokemonInstance>) => void)(id, data);
    } else {
      (fn as (patch: Record<string, Partial<PokemonInstance>>) => void)({ [id]: data });
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[MirrorManager] safeUpdate failed:', e);
    }
  }
}

const MirrorManager: React.FC<MirrorManagerProps> = ({
  pokemon,
  instances,
  ownershipData,
  lists,
  isMirror,
  setIsMirror,
  setMirrorKey,
  editMode,
  updateDisplayedList,
  updateDetails,
}) => {
  const initialMount = useRef<boolean>(true);
  const [hovered, setHovered] = useState<boolean>(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Support either prop name; default to empty map if neither provided.
  const instanceMap: Record<string, PokemonInstance> = instances ?? ownershipData ?? {};

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      const currentMirror = !!pokemon?.instanceData?.mirror;
      setIsMirror(currentMirror);
      if (currentMirror) {
        enableMirror();
      } else {
        disableMirror();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialMount.current && editMode) {
      // Persist “mirror” flag on the current instance if we have an id
      const currentId = pokemon?.instanceData?.instance_id;
      if (currentId) {
        safeUpdate(updateDetails, currentId, { mirror: isMirror });
      }

      // Update what the list actually displays
      if (isMirror) {
        enableMirror();
      } else {
        disableMirror();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMirror, editMode]);

  const enableMirror = (): void => {
    const existingMirrorKey = findExistingMirrorKey();
    if (existingMirrorKey) {
      setMirrorKey(existingMirrorKey);

      const src = instanceMap[existingMirrorKey] || {};
      const enriched: PokemonInstance = {
        ...(src as PokemonInstance),
        variantType: (pokemon as any).variantType,
        pokedex_number: (pokemon as any).pokedex_number as any,
        currentImage: (pokemon as any).currentImage ?? (pokemon as any).image_url,
        name: (pokemon as any).species_name ?? (pokemon as any).name,
        date_available: (pokemon as any).date_available,
        date_shiny_available: (pokemon as any).date_shiny_available,
        date_shadow_available: (pokemon as any).date_shadow_available,
        date_shiny_shadow_available: (pokemon as any).date_shiny_shadow_available,
        costumes: (pokemon as any).costumes,
        shiny_rarity: (pokemon as any).shiny_rarity,
        rarity: (pokemon as any).rarity,
      };

      updateDisplayedList({ [existingMirrorKey]: enriched });
    } else {
      // Create a fresh mirror instance for this variant
      const newMirrorKey = createMirrorEntry(pokemon as any, instanceMap, lists, updateDetails as any);
      setMirrorKey(newMirrorKey);

      const src = instanceMap[newMirrorKey] || {};
      const enriched: PokemonInstance = {
        ...(src as PokemonInstance),
        variantType: (pokemon as any).variantType,
        pokedex_number: (pokemon as any).pokedex_number as any,
        currentImage: (pokemon as any).currentImage ?? (pokemon as any).image_url,
        name: (pokemon as any).species_name ?? (pokemon as any).name,
        date_available: (pokemon as any).date_available,
        date_shiny_available: (pokemon as any).date_shiny_available,
        date_shadow_available: (pokemon as any).date_shadow_available,
        date_shiny_shadow_available: (pokemon as any).date_shiny_shadow_available,
        costumes: (pokemon as any).costumes,
        shiny_rarity: (pokemon as any).shiny_rarity,
        rarity: (pokemon as any).rarity,
      };

      updateDisplayedList({ [newMirrorKey]: enriched });
    }
  };

  const disableMirror = (): void => {
    setMirrorKey(null);
    updateDisplayedList({});
  };

  const toggleMirror = (): void => {
    if (editMode) setIsMirror(!isMirror);
  };

  /**
   * Find an existing mirror by exact variant_id (normalized)
   * and flags wanted/unowned/unlisted. No base-prefix matching.
   */
  const findExistingMirrorKey = (): string | undefined => {
    const targetVariant = getVariantId(pokemon);
    const pidNum = asNumber((pokemon as any)?.pokemon_id);

    if (!targetVariant) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[MirrorManager] No variant_id on pokemon; cannot find mirror.', pokemon);
      }
      return undefined;
    }

    const foundKey = Object.keys(instanceMap).find((key) => {
      const inst = instanceMap[key];
      if (!inst) return false;

      const instVariant = normalizeVariantId((inst as any).variant_id);
      if (instVariant !== targetVariant) return false;

      const wanted = !!(inst as any).is_wanted;
      // Treat either is_owned or is_caught as “owned”
      const ownedish = !!(inst as any).is_owned || !!(inst as any).is_caught;
      const forTrade = !!(inst as any).is_for_trade;

      if (!(wanted && !ownedish && !forTrade)) return false;

      const instPidNum = asNumber((inst as any).pokemon_id);
      if (pidNum != null && instPidNum != null && instPidNum !== pidNum) return false;

      return true;
    });

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[MirrorManager] findExistingMirrorKey:', foundKey || 'No key found', 'variant_id:', targetVariant);
    }
    return foundKey;
  };

  // Tooltip text with dynamic species name
  const dynamicTooltipText: string = `Toggle Mirror<br>This will create or reference a "Wanted" Pokemon<br>Limiting your Wanted List to a <b><u>${(pokemon as any).species_name ?? (pokemon as any).name ?? 'this Pokémon'}</u></b> only`;

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
      document.body
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
        src={'/images/mirror.png'}
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
