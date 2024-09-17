import React from 'react';

const ListView = ({ data }) => {
  return (
    <div className="list-view">
      {data.map((item, index) => (
        <div key={index} className="card">
          <h3>{item.name}</h3>
          <p>Location: {item.location}</p>
          <p>Shiny: {item.isShiny ? 'Yes' : 'No'}</p>
        </div>
      ))}
    </div>
  );
};

export default ListView;
