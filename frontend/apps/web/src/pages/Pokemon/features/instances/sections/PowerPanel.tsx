import React from 'react';
import './PowerPanel.css';
import MaxComponent from '../components/Caught/MaxComponent';
import MaxMovesComponent from '../components/Caught/MaxMovesComponent';
import MegaComponent from '../components/Caught/MegaComponent';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { MegaEvolution } from '@/types/pokemonSubTypes';
import type { MegaData } from '../utils/buildInstanceChanges';
import type { PokemonInstance } from '@/types/pokemonInstance';

type PokemonWithInstance = {
  variantType?: PokemonVariant['variantType'];
  variant_id?: PokemonVariant['variant_id'];
  max?: PokemonVariant['max'];
  instanceData?: Partial<PokemonInstance>;
};

interface PowerPanelProps {
  pokemon: PokemonWithInstance;
  editMode: boolean;
  megaData?: MegaData | Partial<MegaData>;
  setMegaData?: React.Dispatch<React.SetStateAction<MegaData>>;
  megaEvolutions?: MegaEvolution[];
  isShadow: boolean;
  name: string;
  dynamax: boolean;
  gigantamax: boolean;
  showMaxOptions: boolean;
  onToggleMax: () => void;
  maxAttack: string;
  maxGuard: string;
  maxSpirit: string;
  onMaxAttackChange: (value: string) => void;
  onMaxGuardChange: (value: string) => void;
  onMaxSpiritChange: (value: string) => void;
}

const PowerPanel: React.FC<PowerPanelProps> = ({
  pokemon,
  editMode,
  megaData = { isMega: false, mega: false, megaForm: null },
  setMegaData = () => undefined,
  megaEvolutions = [],
  isShadow,
  name,
  dynamax,
  gigantamax,
  showMaxOptions,
  onToggleMax,
  maxAttack,
  maxGuard,
  maxSpirit,
  onMaxAttackChange,
  onMaxGuardChange,
  onMaxSpiritChange,
}) => {
  const normalizedMegaData: MegaData = {
    isMega: Boolean(megaData?.isMega),
    mega: Boolean(megaData?.mega),
    megaForm: megaData?.megaForm ?? null,
  };

  const normalizedMegaEvolutions = megaEvolutions.filter(
    (entry): entry is MegaEvolution & { form: string } => typeof entry.form === 'string',
  );

  return (
    <>
      <div className="max-mega-container">
        <div className="max-component">
          <MaxComponent
            pokemon={pokemon}
            editMode={editMode}
            dynamax={dynamax}
            gigantamax={gigantamax}
            onToggleMax={onToggleMax}
            showMaxOptions={showMaxOptions}
          />
        </div>
        <div className="mega-component">
          <MegaComponent
            megaData={normalizedMegaData}
            setMegaData={setMegaData}
            editMode={editMode}
            megaEvolutions={normalizedMegaEvolutions}
            isShadow={isShadow}
            name={name}
          />
        </div>
      </div>

      <MaxMovesComponent
        pokemon={pokemon}
        editMode={editMode}
        showMaxOptions={showMaxOptions}
        setShowMaxOptions={() => {
          // Kept for compatibility; no-op here.
        }}
        maxAttack={maxAttack}
        maxGuard={maxGuard}
        maxSpirit={maxSpirit}
        handleMaxAttackChange={onMaxAttackChange}
        handleMaxGuardChange={onMaxGuardChange}
        handleMaxSpiritChange={onMaxSpiritChange}
      />
    </>
  );
};

export default PowerPanel;
