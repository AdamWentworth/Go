// MirrorManager.tsx
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { createMirrorEntry } from '../../utils/createMirrorEntry';
import './MirrorManager.css';
import { PokemonVariant } from '@/types/pokemonVariants';
import { PokemonInstance } from '@/types/pokemonInstance';

// Define interfaces for props
interface MirrorManagerProps {
  pokemon: PokemonVariant;
  instances: Record<string, PokemonInstance>;
  lists: any; // Replace with specific type if known
  isMirror: boolean;
  setIsMirror: (value: boolean) => void;
  setMirrorKey: (key: string | null) => void;
  editMode: boolean;
  updateDisplayedList: (data: Record<string, PokemonInstance>) => void;
  updateDetails: any; // Replace with specific type if known
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
  const initialMount = useRef<boolean>(true);
  const [hovered, setHovered] = useState<boolean>(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      setIsMirror(pokemon.instanceData?.mirror || false);
      if (pokemon.instanceData?.mirror) {
        enableMirror();
      } else {
        disableMirror();
      }
    }
  }, []);

  useEffect(() => {
    if (!initialMount.current && editMode) {
      /* 1️⃣ persist “mirror” flag via zustand */
      updateDetails({ [pokemon.pokemonKey]: { mirror: isMirror } });

      /* 2️⃣ update what the list actually displays */
      if (isMirror) {
        enableMirror();
      } else {
        disableMirror();
      }
    }
  }, [isMirror, editMode]);           // ← keep deps the same

  const enableMirror = (): void => {
    const existingMirrorKey = findExistingMirrorKey();
    if (existingMirrorKey) {
      setMirrorKey(existingMirrorKey);

      const enrichedMirrorEntry: PokemonInstance = {
        ...instances[existingMirrorKey],
        variantType: pokemon.variantType,
        pokedex_number: pokemon.pokedex_number,
        currentImage: pokemon.currentImage,
        name: pokemon.species_name,
        date_available: pokemon.date_available,
        date_shiny_available: pokemon.date_shiny_available,
        date_shadow_available: pokemon.date_shadow_available,
        date_shiny_shadow_available: pokemon.date_shiny_shadow_available,
        costumes: pokemon.costumes,
        shiny_rarity: pokemon.shiny_rarity,
        rarity: pokemon.rarity,
      };

      updateDisplayedList({ [existingMirrorKey]: enrichedMirrorEntry });
    } else {
      const newMirrorKey = createMirrorEntry(pokemon, instances, lists, updateDetails);
      setMirrorKey(newMirrorKey);

      const enrichedMirrorEntry: PokemonInstance = {
        ...instances[newMirrorKey],
        variantType: pokemon.variantType,
        pokedex_number: pokemon.pokedex_number,
        currentImage: pokemon.currentImage,
        name: pokemon.species_name,
        date_available: pokemon.date_available,
        date_shiny_available: pokemon.date_shiny_available,
        date_shadow_available: pokemon.date_shadow_available,
        date_shiny_shadow_available: pokemon.date_shiny_shadow_available,
        costumes: pokemon.costumes,
        shiny_rarity: pokemon.shiny_rarity,
        rarity: pokemon.rarity,
      };

      updateDisplayedList({ [newMirrorKey]: enrichedMirrorEntry });
    }
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

  const findExistingMirrorKey = (): string | undefined => {
    const basePrefix = pokemon.pokemonKey.split('_').slice(0, -1).join('_');
    const foundKey = Object.keys(instances).find((key) =>
      key.startsWith(basePrefix) &&
      instances[key].is_wanted &&
      !instances[key].is_owned &&
      !instances[key].is_for_trade &&
      instances[key].pokemon_id === pokemon.pokemon_id
    );
    console.log("findExistingMirrorKey:", foundKey || "No key found");
    return foundKey;
  };

  // Dynamically insert the Pokémon's name into the tooltip text
  const dynamicTooltipText: string = `Toggle Mirror<br>This will create or reference a "Wanted" Pokemon<br>Limiting your Wanted List to a <b><u>${pokemon.species_name}</u></b> only`;

  // Render the tooltip using a portal to a higher-level element (like document.body)
  const renderTooltip = () => {
    if (!hovered || !tooltipRef.current) return null;

    const rect = tooltipRef.current.getBoundingClientRect();
    const tooltipHeight = 50; // Set this value based on the expected height of your tooltip
    const extraSpace = 30; // Add extra space to move the tooltip higher

    return ReactDOM.createPortal(
      <div
        className="tooltip"
        style={{
          position: 'fixed',
          top: `${rect.top - tooltipHeight - extraSpace}px`, // Move the tooltip higher above the image
          left: `${rect.left + rect.width / 2}px`, // Center horizontally above the image
          transform: 'translateX(-50%)', // Adjust for centering
          zIndex: 100000,
          backgroundColor: 'black',
          padding: '10px',
          color: 'white',
          whiteSpace: 'pre', // Prevent breaking lines unless specified by \n
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