// Types.tsx
import React from 'react';
import './Types.css';

type Props = {
  pokemon: {
    type1_name: string;
    type2_name?: string;
    type_1_icon: string;
    type_2_icon?: string;
  };
};

const Types: React.FC<Props> = ({ pokemon }) => {
  const { type1_name, type2_name, type_1_icon, type_2_icon } = pokemon;

  return (
    <div className="type-container">
      <div className="type-icons">
        {type1_name && <img src={type_1_icon} alt={type1_name} className="type-icon" />}
        {type2_name && <img src={type_2_icon} alt={type2_name} className="type-icon" />}
      </div>
      <div className="type-label">
        {type1_name}{type2_name ? ` / ${type2_name}` : ''}
      </div>
    </div>
  );
};

export default Types;