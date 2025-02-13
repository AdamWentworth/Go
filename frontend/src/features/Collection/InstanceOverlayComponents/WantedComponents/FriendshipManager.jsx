// FriendshipManager.jsx

import React from 'react';
import './FriendshipManager.css';

const FriendshipManager = ({
  // Original props
  friendship,
  setFriendship,
  isLucky,
  setIsLucky,

  // New props
  friendship_level,
  setFriendshipLevel,
  pref_lucky,
  setPrefLucky,

  // Common
  editMode,
}) => {
  // 1) DERIVED STATE:
  //    If we have friendship_level, use that; otherwise fallback to friendship or 0
  const actualFriendshipLevel = 
    friendship_level !== undefined 
      ? friendship_level 
      : (friendship || 0);

  //    If we have pref_lucky, use that; otherwise fallback to isLucky or false
  const actualIsLucky = 
    pref_lucky !== undefined 
      ? pref_lucky
      : (isLucky || false);

  // 2) DERIVED SETTERS:
  //    When changing friendship, call either setFriendshipLevel or setFriendship
  const handleSetFriendshipLevel = (newVal) => {
    if (setFriendshipLevel) {
      setFriendshipLevel(newVal);
    } else if (setFriendship) {
      setFriendship(newVal);
    }
  };

  //    When toggling lucky, call either setPrefLucky or setIsLucky
  const handleSetIsLucky = (newVal) => {
    if (setPrefLucky) {
      setPrefLucky(newVal);
    } else if (setIsLucky) {
      setIsLucky(newVal);
    }
  };

  // 3) HANDLERS:
  const handleFriendshipChange = (e) => {
    const newLevel = parseInt(e.target.value, 10);

    // If we turn off "lucky" automatically if the new level != 4
    if (actualIsLucky && newLevel !== 4) {
      handleSetIsLucky(false);
    }
    handleSetFriendshipLevel(newLevel);
  };

  const toggleLucky = () => {
    if (editMode) {
      const newLuckyStatus = !actualIsLucky;
      handleSetIsLucky(newLuckyStatus);
      if (newLuckyStatus) {
        // If we turn on "lucky", set friendship to 4
        handleSetFriendshipLevel(4);
      }
    }
  };

  // 4) RENDER HEARTS:
  const hearts = [];
  for (let i = 0; i < 4; i++) {
    hearts.push(
      <img
        key={`heart-${i}`}
        src={`${process.env.PUBLIC_URL}/images/${i < actualFriendshipLevel ? 'heart-filled' : 'heart-unfilled'}.png`}
        alt={`Friendship Level ${i < actualFriendshipLevel ? 'Filled' : 'Unfilled'}`}
        className="heart"
      />
    );
  }

  return (
    <div className="friendship-level-container">
      <div className="hearts-lucky-container">
        <div className="hearts">{hearts}</div>

        <img
          src={`${process.env.PUBLIC_URL}/images/lucky_friend_icon.png`}
          alt="Lucky Friend"
          className={`lucky-icon ${actualIsLucky ? '' : 'grey-out'}`}
          onClick={toggleLucky}
          style={{ cursor: editMode ? 'pointer' : 'default' }}
        />
      </div>

      {editMode && (
        <input
          type="range"
          min="0"
          max="4"
          value={actualFriendshipLevel}
          onChange={handleFriendshipChange}
          className="friendship-slider"
        />
      )}
    </div>
  );
};

export default FriendshipManager;
