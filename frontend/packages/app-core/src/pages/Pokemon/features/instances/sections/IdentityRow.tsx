import React from 'react';
import './IdentityRow.css';
import LuckyComponent from '../components/Caught/LuckyComponent';
import NameComponent from '../components/Caught/NameComponent';
import PurifyComponent from '../components/Caught/PurifyComponent';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';

type PokemonWithInstance = {
  name?: string;
  rarity?: PokemonVariant['rarity'];
  instanceData?: Partial<PokemonInstance>;
};

interface IdentityRowProps {
  pokemon: PokemonWithInstance;
  isLucky: boolean;
  isShadow: boolean;
  isPurified: boolean;
  editMode: boolean;
  onToggleLucky: (value: boolean) => void;
  onNicknameChange: (value: string | null) => void;
  onTogglePurify: (value: boolean) => void;
  showLucky?: boolean;
  showPurify?: boolean;
}

const IdentityRow: React.FC<IdentityRowProps> = ({
  pokemon,
  isLucky,
  isShadow,
  isPurified,
  editMode,
  onToggleLucky,
  onNicknameChange,
  onTogglePurify,
  showLucky = true,
  showPurify = true,
}) => (
  <div className="purify-name-shadow-container">
    <div className="lucky-component">
      {showLucky ? (
        <LuckyComponent
          pokemon={pokemon}
          onToggleLucky={onToggleLucky}
          isLucky={isLucky}
          editMode={editMode}
          isShadow={isShadow}
        />
      ) : null}
    </div>

    <div className="identity-name-slot">
      <NameComponent
        pokemon={pokemon}
        editMode={editMode}
        onNicknameChange={onNicknameChange}
      />
    </div>

    <div className="purify-component">
      {showPurify ? (
        <PurifyComponent
          isShadow={isShadow}
          isPurified={isPurified}
          editMode={editMode}
          onTogglePurify={onTogglePurify}
        />
      ) : null}
    </div>
  </div>
);

export default IdentityRow;
