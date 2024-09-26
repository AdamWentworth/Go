// FieldGroup.jsx
import React from 'react';

const FieldGroup = ({ 
  isLucky, 
  setIsLucky, 
  prefLucky, 
  setPrefLucky, 
  height, 
  setHeight, 
  weight, 
  setWeight, 
  showLucky = true, 
  showPrefLucky = true 
}) => {
  return (
    <div className="field-group">
      {showLucky && (
        <div className="field">
          <label>Lucky</label>
          <input
            type="checkbox"
            checked={isLucky}
            onChange={(e) => setIsLucky(e.target.checked)}
          />
        </div>
      )}
      {showPrefLucky && (
        <div className="field">
          <label>Preferred Lucky</label>
          <input
            type="checkbox"
            checked={prefLucky}
            onChange={(e) => setPrefLucky(e.target.checked)}
          />
        </div>
      )}
      <div className="field">
        <label>Height</label>
        <input
          type="number"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          placeholder="Enter Height"
        />
      </div>
      <div className="field">
        <label>Weight</label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Enter Weight"
        />
      </div>
    </div>
  );
};

export default FieldGroup;
