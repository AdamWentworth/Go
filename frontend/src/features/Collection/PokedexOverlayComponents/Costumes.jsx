import React, { useState } from 'react';
import './Costumes.css';
import './Costumes-Fullscreen.css';
import { formatCostumeName } from '../../../utils/formattingHelpers';

function Costumes({ costumes, isMale }) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    if (!isFullScreen) {
      document.body.classList.add('fullscreen-active');
    } else {
      document.body.classList.remove('fullscreen-active');
    }
    setIsFullScreen(!isFullScreen);
  };

  // Determine the class name based on whether the "View All" button should be displayed
  const columnClass = `column costume-column ${isFullScreen ? 'fullscreen' : ''} ${costumes.length < 4 ? 'no-view-all' : ''}`;

  return (
    <div className={columnClass}>
      <h1>Costumes</h1>
      {costumes.length >= 4 && (
        <div className="button-container">
          <button onClick={toggleFullScreen} className="fullscreen-toggle">
            {isFullScreen ? 'Exit' : 'View All'}
          </button>
        </div>
      )}
      <ul className={costumes.length >= 4 ? 'has-view-all' : ''}>
        {costumes.map((costume, index) => (
          <li key={index}>
            <div className="costume-images">
              <img 
                src={isMale ? costume.image_url : costume.image_url_female || costume.image_url} 
                alt={`Costume - ${formatCostumeName(costume.name)}`} 
              />
              {costume.shiny_available === 1 && (
                <img 
                  src={isMale ? costume.image_url_shiny : costume.image_url_shiny_female || costume.image_url_shiny} 
                  alt={`Shiny Costume - ${formatCostumeName(costume.name)}`} 
                />
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