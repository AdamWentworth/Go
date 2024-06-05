// HeightComponent.jsx
import React, { useState } from 'react';

const HeightComponent = ({ pokemon }) => {
  const [height, setHeight] = useState(pokemon.height);

  return (
    <div className="height-component">
      <label className="height-label">Height: </label>
      <span className="height-value">{height}</span>
    </div>
  );
};

export default HeightComponent;
