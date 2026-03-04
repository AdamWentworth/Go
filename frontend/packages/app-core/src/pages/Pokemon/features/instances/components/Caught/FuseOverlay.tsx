import React from 'react';
import './FuseOverlay.css';
import type { PokemonVariant } from '@/types/pokemonVariants';
import { createScopedLogger } from '@/utils/logger';
import { resolveAssetUrl } from '@/utils/assetUrl';
import type { PokemonInstance } from '@/types/pokemonInstance';

const log = createScopedLogger('FuseOverlay');

interface FuseOverlayProps {
  candidates: PokemonVariant[];
  selectedPokemon: PokemonVariant | null;
  onSelectPokemon: (pokemon: PokemonVariant) => void;
  onClose: () => void;
  onFuse?: () => void;
}

const getCandidateImage = (pokemon: PokemonVariant): string => {
  const ownership: Partial<PokemonInstance> = pokemon.instanceData ?? {};
  const isShiny = Boolean(ownership.shiny);
  const isShadow = Boolean(ownership.shadow);

  if (isShiny && isShadow && pokemon.image_url_shiny_shadow) {
    return resolveAssetUrl(pokemon.image_url_shiny_shadow);
  }
  if (isShadow && pokemon.image_url_shadow) {
    return resolveAssetUrl(pokemon.image_url_shadow);
  }
  if (isShiny && pokemon.image_url_shiny) {
    return resolveAssetUrl(pokemon.image_url_shiny);
  }
  return resolveAssetUrl(pokemon.currentImage || pokemon.image_url || '');
};

const getCandidateTitle = (pokemon: PokemonVariant): string => {
  const nickname = pokemon.instanceData?.nickname;
  if (typeof nickname === 'string' && nickname.trim().length > 0) {
    return nickname.trim();
  }
  return pokemon.species_name || pokemon.name || `#${pokemon.pokemon_id}`;
};

const formatStatNumber = (value: unknown): string =>
  typeof value === 'number' && Number.isFinite(value) ? String(value) : '—';

const FuseOverlay: React.FC<FuseOverlayProps> = ({
  candidates,
  selectedPokemon,
  onSelectPokemon,
  onClose,
  onFuse,
}) => {
  const activePokemon = selectedPokemon ?? candidates[0] ?? null;

  const handleFuse = () => {
    if (!activePokemon) return;
    log.debug('Fuse button clicked for', activePokemon);
    if (onFuse) onFuse();
  };

  if (!activePokemon) {
    return null;
  }

  return (
    <div className="fuse-overlay">
      <div className="overlay-content">
        <h3 className="fuse-overlay-title">Select Fusion Partner</h3>
        <div className="fuse-candidate-list" role="list" aria-label="Fusion candidates">
          {candidates.map((candidate) => {
            const isSelected =
              Boolean(candidate.instanceData?.instance_id) &&
              candidate.instanceData?.instance_id === activePokemon.instanceData?.instance_id;

            return (
              <button
                key={candidate.instanceData?.instance_id ?? candidate.variant_id}
                type="button"
                className={`fuse-candidate-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onSelectPokemon(candidate)}
                aria-pressed={isSelected}
              >
                <img
                  src={getCandidateImage(candidate)}
                  alt={getCandidateTitle(candidate)}
                  className="fuse-candidate-image"
                />

                <div className="fuse-candidate-details">
                  <div className="fuse-candidate-name">{getCandidateTitle(candidate)}</div>
                  <div className="fuse-candidate-subtitle">
                    {candidate.species_name || candidate.name || `#${candidate.pokemon_id}`}
                  </div>
                </div>

                <div className="fuse-candidate-stats">
                  <span>CP {formatStatNumber(candidate.instanceData?.cp)}</span>
                  <span>LVL {formatStatNumber(candidate.instanceData?.level)}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="fuse-overlay-actions">
          <button type="button" onClick={onClose} className="close-overlay">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleFuse}
            className="fuse-button"
            disabled={!activePokemon}
          >
            Fuse
          </button>
        </div>
      </div>
    </div>
  );
};

export default FuseOverlay;
