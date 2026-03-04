import React from 'react';
import './FusionComponent.css';
import { resolveAssetUrl } from '@/utils/assetUrl';

import type { Fusion } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';

interface FusionState {
  is_fused: boolean;
  fusion_form: number | string | null;
}

interface FusionComponentProps {
  fusion: Fusion[] | null;
  editMode: boolean;
  pokemon: PokemonVariant;
  onFusionToggle: (fusionId: number) => void;
  onUndoFusion: () => void;
  fusionState: FusionState;
}

const buildFusionIconUrl = (fusionId: number, isShiny: boolean) =>
  resolveAssetUrl(
    isShiny
      ? `/media/images/shiny_fusion/shiny_fusion_${fusionId}.png`
      : `/media/images/fusion/fusion_${fusionId}.png`,
  );

const FusionComponent: React.FC<FusionComponentProps> = ({
  fusion,
  editMode,
  pokemon,
  onFusionToggle,
  onUndoFusion,
  fusionState,
}) => {
  const fusionOptions = (fusion ?? []).filter(
    (item): item is Fusion & { fusion_id: number } =>
      item.base_pokemon_id1 === pokemon.pokemon_id &&
      typeof item.fusion_id === 'number',
  );

  const hasOptions = fusionOptions.length > 0;

  if (!fusionState.is_fused && !hasOptions) {
    return null;
  }

  const currentFusion =
    fusionOptions.find((item) => {
      if (fusionState.fusion_form == null) return false;
      return (
        String(item.fusion_id) === String(fusionState.fusion_form) ||
        item.name === fusionState.fusion_form
      );
    }) ?? null;

  return (
    <div className="fusion-component">
      {fusionState.is_fused ? (
        <div className="fusion-state-row">
          {currentFusion?.fusion_id != null ? (
            <img
              src={buildFusionIconUrl(currentFusion.fusion_id, Boolean(pokemon.instanceData?.shiny))}
              alt={currentFusion.name ?? 'Fusion form'}
              className="fusion-state-icon"
            />
          ) : null}

          <span className="fusion-state-label">
            {currentFusion?.name ?? fusionState.fusion_form ?? 'Fusion active'}
          </span>

          <button
            type="button"
            className="fusion-action-button"
            disabled={!editMode}
            onClick={onUndoFusion}
            title={editMode ? undefined : 'Enable edit mode to separate this fusion.'}
          >
            Separate
          </button>
        </div>
      ) : (
        <div className={`fusion-option-list ${fusionOptions.length === 1 ? 'single' : 'multiple'}`}>
          {fusionOptions.map((fusionItem) => (
            <button
              key={fusionItem.fusion_id}
              type="button"
              className="fusion-option-button"
              disabled={!editMode}
              onClick={() => onFusionToggle(fusionItem.fusion_id)}
              title={editMode ? undefined : 'Enable edit mode to fuse this Pokemon.'}
            >
              <img
                src={buildFusionIconUrl(fusionItem.fusion_id, Boolean(pokemon.instanceData?.shiny))}
                alt={fusionItem.name || `Fusion ${fusionItem.fusion_id}`}
                className="fusion-option-icon"
              />
              <span className="fusion-option-text">
                {fusionOptions.length === 1 ? 'Fuse' : `Fuse ${fusionItem.name}`}
              </span>
            </button>
          ))}
        </div>
      )}

      {!editMode ? (
        <p className="fusion-edit-hint">Enable edit mode to change fusion state.</p>
      ) : null}
    </div>
  );
};

export default FusionComponent;
