// ListView.jsx

import React from 'react';

const ListView = ({ data }) => {
  // Ensure data is an array
  if (!Array.isArray(data)) {
    return <div>No data available.</div>;
  }

  return (
    <div className="list-view">
      {data.length === 0 ? (
        <div>No Pokémon found matching your criteria.</div>
      ) : (
        data.map((item, index) => (
          <div key={index} className="card">
            <h3>{item.name}</h3>
            <p>Location: {item.location}</p>
            <p>Shiny: {item.isShiny ? 'Yes' : 'No'}</p>
            {item.distance && <p>Distance: {item.distance.toFixed(2)} km</p>}
          </div>
        ))
      )}
    </div>
  );
};

export default ListView;
