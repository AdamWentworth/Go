// FriendshipManager.tsx

import React from 'react';
import './FriendshipManager.css';

interface FriendshipManagerProps {
  // Original props
  friendship?: number;
  setFriendship?: (val: number) => void;
  isLucky?: boolean;
  setIsLucky?: (val: boolean) => void;

  // New props
  friendship_level?: number;
  setFriendshipLevel?: (val: number) => void;
  pref_lucky?: boolean;
  setPrefLucky?: (val: boolean) => void;

  // Common
  editMode: boolean;
}

const FriendshipManager: React.FC<FriendshipManagerProps> = ({
  friendship,
  setFriendship,
  isLucky,
  setIsLucky,
  friendship_level,
  setFriendshipLevel,
  pref_lucky,
  setPrefLucky,
  editMode,
}) => {
  // 1) DERIVED STATE:
  const actualFriendshipLevel = 
    friendship_level !== undefined 
      ? friendship_level 
      : (friendship || 0);

  const actualIsLucky = 
    pref_lucky !== undefined 
      ? pref_lucky 
      : (isLucky || false);

  // 2) DERIVED SETTERS:
  const handleSetFriendshipLevel = (newVal: number) => {
    if (setFriendshipLevel) {
      setFriendshipLevel(newVal);
    } else if (setFriendship) {
      setFriendship(newVal);
    }
  };

  const handleSetIsLucky = (newVal: boolean) => {
    if (setPrefLucky) {
      setPrefLucky(newVal);
    } else if (setIsLucky) {
      setIsLucky(newVal);
    }
  };

  // 3) HANDLERS:
  const handleFriendshipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLevel = parseInt(e.target.value, 10);

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
        src={`/images/${i < actualFriendshipLevel ? 'heart-filled' : 'heart-unfilled'}.png`}
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
          src={`/images/lucky_friend_icon.png`}
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
