// src/pages/Pokemon/features/pokedex/Costumes.tsx

import React, { useState } from 'react';
import './Costumes.css';
import './Costumes-Fullscreen.css';
import { formatCostumeName } from '@/utils/formattingHelpers';

// Use shared Costume type
import type { Costume } from '@/types/pokemonSubTypes';

export interface CostumesProps {
  costumes: Costume[];
  isMale: boolean;
}

const Costumes: React.FC<CostumesProps> = ({ costumes, isMale }) => {
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const toggleFullScreen = (): void => {
    document.body.classList.toggle('fullscreen-active', !isFullScreen);
    setIsFullScreen(prev => !prev);
  };

  const columnClass = `column costume-column ${isFullScreen ? 'fullscreen' : ''} ${
    costumes.length < 4 ? 'no-view-all' : ''
  }`;

  return (
    <div className={columnClass}>
      <h1>Costumes</h1>
      {costumes.length >= 4 && (
        <div className="button-container">
          <button
            onClick={toggleFullScreen}
            className="fullscreen-toggle"
            type="button"
          >
            {isFullScreen ? 'Exit' : 'View All'}
          </button>
        </div>
      )}
      <ul className={costumes.length >= 4 ? 'has-view-all' : ''}>
        {costumes.map((costume) => {
          const maleImg = costume.image_url!;
          const femaleImg = costume.image_url_female || costume.image_url!;
          const shinyMale = costume.image_url_shiny!;
          const shinyFemale = costume.image_url_shiny_female || costume.image_url_shiny!;

          return (
            <li key={costume.costume_id}>
              <div className="costume-images">
                <img
                  src={isMale ? maleImg : femaleImg}
                  alt={`Costume - ${formatCostumeName(costume.name)}`}
                />
                {Boolean(costume.shiny_available) && (
                  <img
                    src={isMale ? shinyMale : shinyFemale}
                    alt={`Shiny Costume - ${formatCostumeName(costume.name)}`}
                  />
                )}
              </div>
              <strong>{formatCostumeName(costume.name)}</strong>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default React.memo(Costumes);
