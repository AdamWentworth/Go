// MegaPokemonModal.tsx
import MegaPokemonSelection from '../components/MegaPokemonSelection';
import type { MegaSelectionData } from '../hooks/useMegaPokemonHandler';

interface Props {
  open: boolean;
  data: MegaSelectionData | null;
  onResolve: (option: string) => void;
  onReject: (reason?: any) => void;
}

export default function MegaPokemonModal({
  open,
  data,
  onResolve,
  onReject,
}: Props) {
  if (!open || !data) return null;

  return (
    <MegaPokemonSelection
      ownedPokemon={data.ownedPokemon}
      variantKey={data.variantKey}
      megaForm={data.megaForm}
      onAssignExisting={() => onResolve('assignExisting')}
      onCreateNew={() => onResolve('createNew')}
      onCancel={() => onReject('User canceled')}
    />
  );
}
