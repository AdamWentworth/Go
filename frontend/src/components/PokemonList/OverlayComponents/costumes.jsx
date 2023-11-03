/* costumes.jsx */

import React, { useState } from 'react';
import './costumes.css'; // You will create this CSS file in the next step
import './costumes-fullscreen.css'; // You will create this CSS file in the next step
import { formatCostumeName } from '../../../utils/formattingHelpers';

function Costumes({ costumes }) {
  // State to manage if the full screen mode is active or not
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Toggle the full screen mode
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
      <button onClick={toggleFullScreen} className="fullscreen-toggle">
        {isFullScreen ? 'Exit' : 'View All'}
      </button>
      <h1>Costumes</h1>
      {/* Button to toggle full screen */}
      
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
