import React, { useState } from 'react';
import './costumes.css';
import './costumes-fullscreen.css';
import { formatCostumeName } from '../../../utils/formattingHelpers';

function Costumes({ costumes }) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    if (!isFullScreen) {
      document.body.classList.add('fullscreen-active');
    } else {
      document.body.classList.remove('fullscreen-active');
    }
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div className={`column costume-column ${isFullScreen ? 'fullscreen' : ''}`}>
      <h1>Costumes</h1>
      <div className="button-container">
        {/* Conditional rendering based on the number of costumes */}
        {costumes.length >= 4 && (
          <button onClick={toggleFullScreen} className="fullscreen-toggle">
            {isFullScreen ? 'Exit' : 'View All'}
          </button>
        )}
      </div>      
      <ul>
        {costumes.map((costume, index) => (
          <li key={index}>
            <div className="costume-images">
              <img src={costume.image} alt={`Costume - ${formatCostumeName(costume.name)}`} />
              {costume.shiny_available === 1 && (
                <img src={costume.shiny_image} alt={`Shiny Costume - ${formatCostumeName(costume.name)}`} />
              )}
            </div>
            <strong>{formatCostumeName(costume.name)}</strong>
          </li>
        ))}
      </ul>
    </div>  
  );
}

export default Costumes;
