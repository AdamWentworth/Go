import React from 'react';
import './LevelGenderRow.css';
import Level from '@/components/pokemonComponents/Level';
import Gender from '@/components/pokemonComponents/Gender';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';

type PokemonWithInstance = {
  gender_rate?: PokemonVariant['gender_rate'];
  instanceData?: Pick<PokemonInstance, 'gender'>;
};

interface LevelGenderRowProps {
  pokemon: PokemonWithInstance;
  editMode: boolean;
  level: number | null;
  onLevelChange: (value: string) => void;
  gender: string | null;
  onGenderChange: (value: string | null) => void;
}

const LevelGenderRow: React.FC<LevelGenderRowProps> = ({
  pokemon,
  editMode,
  level,
  onLevelChange,
  gender,
  onGenderChange,
}) => (
  <div className="level-gender-row">
    <Level
      editMode={editMode}
      level={level}
      onLevelChange={onLevelChange}
    />
    {(editMode || (gender !== null && gender !== '')) && (
      <div className="gender-wrapper">
        <Gender
          pokemon={pokemon}
          editMode={editMode}
          onGenderChange={onGenderChange}
        />
      </div>
    )}
  </div>
);

export default LevelGenderRow;

