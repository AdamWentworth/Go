import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

import { buildMirrorInstance } from '@/pages/Pokemon/features/instances/utils/createMirrorEntry';
import type { PokemonInstance } from '@/types/pokemonInstance';
import { createScopedLogger } from '@/utils/logger';
import {
  buildMirrorTooltipHtml,
  enrichMirrorInstanceForDisplay,
  findExistingMirrorKey,
  type MirrorPokemon,
  type UpdateDetailsFn,
} from './mirrorManagerState';

import './MirrorManager.css';

const log = createScopedLogger('MirrorManager');

interface MirrorManagerProps {
  pokemon: MirrorPokemon;
  instances?: Record<string, PokemonInstance>;
  lists: Record<string, Record<string, unknown>>;
  isMirror: boolean;
  setIsMirror: (value: boolean) => void;
  setMirrorKey: (key: string | null) => void;
  editMode: boolean; // mirrors parent isEditable
  updateDisplayedList: (data: Record<string, PokemonInstance>) => void;
  updateDetails?: UpdateDetailsFn;
}

const MirrorManager: React.FC<MirrorManagerProps> = ({
  pokemon,
  instances,
  isMirror,
  setIsMirror,
  setMirrorKey,
  editMode,
  updateDisplayedList,
}) => {
  const initialMount = useRef(true);
  const [hovered, setHovered] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const enableMirrorRef = useRef<() => void>(() => {});
  const disableMirrorRef = useRef<() => void>(() => {});

  const instanceMap: Record<string, PokemonInstance> = instances ?? {};

  useEffect(() => {
    if (!initialMount.current) return;

    initialMount.current = false;
    const currentMirror = !!pokemon.instanceData?.mirror;
    setIsMirror(currentMirror);

    if (currentMirror) {
      enableMirrorRef.current();
    } else {
      disableMirrorRef.current();
    }
  }, [pokemon.instanceData?.mirror, setIsMirror]);

  useEffect(() => {
    if (initialMount.current || !editMode) return;

    if (isMirror) {
      enableMirrorRef.current();
    } else {
      disableMirrorRef.current();
    }
  }, [editMode, isMirror]);

  const enableMirror = (): void => {
    const existingMirrorKey = findExistingMirrorKey({
      pokemon,
      instanceMap,
      onMissingVariant: (sourcePokemon) => {
        log.warn('No variant_id on pokemon; cannot find mirror.', sourcePokemon);
      },
      onResolved: (key, variantId) => {
        log.debug('findExistingMirrorKey:', key || 'No key found', 'variant_id:', variantId);
      },
    });
    if (existingMirrorKey) {
      setMirrorKey(existingMirrorKey);

      const source = instanceMap[existingMirrorKey];
      if (!source) {
        log.warn('Mirror key resolved but instance not found:', existingMirrorKey);
        updateDisplayedList({});
        return;
      }

      updateDisplayedList({
        [existingMirrorKey]: enrichMirrorInstanceForDisplay(source, pokemon),
      });
      return;
    }

    const newMirrorInstance = buildMirrorInstance(pokemon);
    const newMirrorKey = newMirrorInstance.instance_id;
    setMirrorKey(newMirrorKey);

    updateDisplayedList({
      [newMirrorKey]: enrichMirrorInstanceForDisplay(
        newMirrorInstance as PokemonInstance,
        pokemon,
      ),
    });
  };

  const disableMirror = (): void => {
    setMirrorKey(null);
    updateDisplayedList({});
  };

  enableMirrorRef.current = enableMirror;
  disableMirrorRef.current = disableMirror;

  const toggleMirror = (): void => {
    if (editMode) {
      setIsMirror(!isMirror);
    }
  };

  const dynamicTooltipText = buildMirrorTooltipHtml(pokemon);

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
