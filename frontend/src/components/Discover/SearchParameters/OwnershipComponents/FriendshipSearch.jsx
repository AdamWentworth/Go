// FriendshipSearch.jsx

import React from 'react';
import './FriendshipSearch.css';

const FriendshipSearch = ({ friendshipLevel, setFriendshipLevel, prefLucky, setPrefLucky }) => {
  const handleFriendshipChange = (e) => {
    const newFriendshipLevel = parseInt(e.target.value, 10);
    setFriendshipLevel(newFriendshipLevel);
    
    if (newFriendshipLevel < 4) {
      setPrefLucky(false);  // Turn off Preferred Lucky if friendship level is less than 4
    }
  };

  const toggleLucky = () => {
    if (!prefLucky) {
      setFriendshipLevel(4);  // Set to max friendship when Lucky is toggled on
    }
    setPrefLucky(!prefLucky);
  };

  const hearts = [];
  for (let i = 0; i < 4; i++) {
    hearts.push(
      <img
        key={`heart-${i}`}
        src={`${process.env.PUBLIC_URL}/images/${i < friendshipLevel ? 'heart-filled' : 'heart-unfilled'}.png`}
        alt={`Friendship Level ${i < friendshipLevel ? 'Filled' : 'Unfilled'}`}
        className="heart"
      />
    );
  }

  return (
    <div className="friendship-search-options">
      <div className="hearts-lucky-container">
        <div className="hearts">
          {hearts}
        </div>
        <img
          src={`${process.env.PUBLIC_URL}/images/lucky_friend_icon.png`}
          alt="Lucky Friend"
          className={`lucky-icon ${prefLucky ? '' : 'grey-out'}`}
          onClick={toggleLucky}
          style={{ cursor: friendshipLevel === 4 || !prefLucky ? 'pointer' : 'default' }}
        />
      </div>
      <input
        type="range"
        min="0"
        max="4"
        value={friendshipLevel}
        onChange={handleFriendshipChange}
        className="friendship-slider"
      />
    </div>
  );
};

export default FriendshipSearch;