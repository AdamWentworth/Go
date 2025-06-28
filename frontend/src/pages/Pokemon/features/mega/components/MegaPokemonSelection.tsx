// MegaPokemonSelection.jsx
import './MegaPokemonSelection.css';
import OwnedInstance from '../../instances/OwnedInstance';
import CloseButton from '@/components/CloseButton';
import { useMegaPokemonSelection } from '../hooks/useMegaPokemonSelection';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

interface Props {
  ownedPokemon: (PokemonInstance & { variantData: PokemonVariant | null })[];
  variantKey : string | undefined;
  megaForm   : string | undefined;
  onAssignExisting: (id: string) => void;
  onCreateNew    : () => void;
  onCancel       : () => void;
}

export default function MegaPokemonSelection({
  ownedPokemon,
  variantKey,
  megaForm,
  onAssignExisting,
  onCreateNew,
  onCancel,
}: Props) {
  const { error, assignExisting, createNew } =
    useMegaPokemonSelection(variantKey, megaForm, onAssignExisting, onCreateNew);

  return (
    <div className="mega-pokemon-selection-overlay" role="dialog" aria-modal="true">
      <div className="mega-modal-content">
        <h2>Mega Evolve Pokémon</h2>

        <div className="create-new-action">
          <button onClick={createNew}>Generate and Evolve New</button>
        </div>

        {error && <p className="error">{error}</p>}

        {ownedPokemon.length ? (
          <div className="mega-pokemon-list">
            {ownedPokemon.map(({ instance_id, variantData, ...rest }) => (
              <div key={instance_id} className="mega-pokemon-item">
                <div className="mega-actions">
                  <button onClick={() => assignExisting(instance_id!)}>Mega Evolve</button>
                </div>
                {variantData ? (
                  <OwnedInstance
                        pokemon={{ ...variantData, instanceData: { instance_id, ...rest } }}
                        isEditable={false}      // or whatever flag your UI needs
                    />
                ) : (
                  <p>Error loading Pokémon {instance_id}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No owned Pokémon suitable for Mega evolution.</p>
        )}
      </div>

      <CloseButton onClick={onCancel} />
    </div>
  );
}
