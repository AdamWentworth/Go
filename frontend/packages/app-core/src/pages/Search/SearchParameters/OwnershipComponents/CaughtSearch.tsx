import React from 'react';

import IV from '@/components/pokemonComponents/IV';
import './CaughtSearch.css';

type IvValues = {
  Attack: number | '' | null;
  Defense: number | '' | null;
  Stamina: number | '' | null;
};

type CaughtSearchProps = {
  ivs: IvValues;
  onIvChange: (newIvs: IvValues) => void;
  isHundo: boolean;
  setIsHundo: React.Dispatch<React.SetStateAction<boolean>>;
};

const CaughtSearch: React.FC<CaughtSearchProps> = ({
  ivs,
  onIvChange,
  isHundo,
  setIsHundo,
}) => {
  const handleChange = (newIvs: IvValues) => {
    onIvChange(newIvs);
  };

  return (
    <div className="caught-options-container">
      <div className="options-column">
        <IV
          mode="search"
          ivs={ivs}
          onIvChange={handleChange}
          isHundo={isHundo}
          setIsHundo={setIsHundo}
        />
      </div>
    </div>
  );
};

export default CaughtSearch;
