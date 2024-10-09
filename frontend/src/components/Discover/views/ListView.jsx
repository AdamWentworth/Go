// ListView.jsx

import React from 'react';
import './ListView.css';
import { URLSelect } from '../utils/URLSelect'; // Adjust the path as necessary

const ListView = ({ data }) => {
  if (!Array.isArray(data)) {
    return <div>No data available.</div>;
  }
  console.log(data);
  return (
    <div className="list-view">
      {data.length === 0 ? (
        <div>No Pokémon found matching your criteria.</div>
      ) : (
        data.map((item, index) => {
          const imageUrl = URLSelect(item.pokemonInfo, item);

          return (
            <div key={index} className="card">
              <h3>{item.username}</h3>
              <p>Location: {item.location}</p>
              {item.distance && <p>Distance: {item.distance.toFixed(2)} km</p>}
              {item.pokemonInfo && (
                <div>
                  {imageUrl && <img src={imageUrl} alt={item.pokemonInfo.name} />}
                  <p>Pokémon: {item.pokemonInfo.name}</p>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default ListView;
