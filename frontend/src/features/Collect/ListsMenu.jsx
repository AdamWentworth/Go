// ListsMenu.jsx

import React from 'react';
import './ListsMenu.css';

const ListsMenu = ({ onSelectList }) => {
  const lists = ['Unowned', 'Owned', 'Trade', 'Wanted'];

  return (
    <div className="lists-menu">
      {lists.map((list) => (
        <button
          key={list}
          className={`filter-button ${list}`}
          onClick={() => onSelectList(list)}
        >
          {list}
        </button>
      ))}
    </div>
  );
};

export default ListsMenu;

