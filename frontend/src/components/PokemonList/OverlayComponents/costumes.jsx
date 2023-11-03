/* costumes.jsx */

import React from 'react';
import './costumes.css'; // You will create this CSS file in the next step
import { formatCostumeName } from '../../../utils/formattingHelpers';

function Costumes({ costumes }) {
  return (
    <div className="column costume-column">
      <h1>Costumes</h1>
      <ul>
        {costumes.map((costume, index) => (
          <li key={index}>
            <div className="costume-images">
              <img src={costume.image} alt={`Costume - ${formatCostumeName(costume.name)}`} />
              {costume.shiny_available === 1 && (
                <img src={costume.shiny_image} alt={`Shiny Costume - ${formatCostumeName(costume.name)}`} />
              )}
            </div>
            {formatCostumeName(costume.name)}
          </li>
        ))}
      </ul>
    </div>  
  );
}

export default Costumes;
