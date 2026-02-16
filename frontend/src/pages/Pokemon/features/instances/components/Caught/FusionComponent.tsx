// Caught/FusionComponent.tsx
import React from 'react';
import './FusionComponent.css'; // Optional: create and style this as needed

import type { Fusion } from '@/types/pokemonSubTypes'; // Adjust path if needed
import type { PokemonVariant } from '@/types/pokemonVariants'; // Adjust path if needed

interface FusionState {
  is_fused: boolean;
  fusion_form: number | string | null; // Based on your `PokemonInstance` type, fusion_form can be string or null
}

interface FusionComponentProps {
  fusion: Fusion[] | null;
  editMode: boolean;
  pokemon: PokemonVariant;
  onFusionToggle: (fusionId: number) => void;
  onUndoFusion: () => void;
  fusionState: FusionState;
}

const FusionComponent: React.FC<FusionComponentProps> = ({
  fusion,
  editMode,
  pokemon,
  onFusionToggle,
  onUndoFusion,
  fusionState,
}) => {
  if (!editMode || !fusion || fusion.length === 0) {
    return null;
  }

  const validFusions = fusion.filter(item => item.base_pokemon_id1 === pokemon.pokemon_id);

  if (validFusions.length === 0) {
    return null;
  }

  const imageClass = validFusions.length === 1 ? 'single' : 'multiple';

  return (
    <div className="fusion-component">
      {fusionState.is_fused ? (
        <button onClick={onUndoFusion} className="undo-fusion-button">
          Separate
        </button>
      ) : (
        <div className={`fusion-images ${imageClass}`}>
          {validFusions.map((fusionItem) => (
            <img
              key={fusionItem.fusion_id ?? fusionItem.name} // Fusion id is sometimes optional, so fallback
              src={`/images/fusion_${fusionItem.fusion_id}.png`}
              alt={fusionItem.name || `Fusion ${fusionItem.fusion_id}`}
              onClick={() => onFusionToggle(fusionItem.fusion_id!)} // Assuming fusion_id exists at runtime
              className={
                fusionState.is_fused && fusionState.fusion_form === fusionItem.fusion_id
                  ? 'active-fusion'
                  : ''
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FusionComponent;
