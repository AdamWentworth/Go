import React from 'react';

import './FriendshipSearch.css';

type FriendshipSearchProps = {
  friendshipLevel: number;
  setFriendshipLevel: React.Dispatch<React.SetStateAction<number>>;
  prefLucky: boolean;
  setPrefLucky: React.Dispatch<React.SetStateAction<boolean>>;
};

const MAX_FRIENDSHIP_LEVEL = 4;

const FriendshipSearch: React.FC<FriendshipSearchProps> = ({
  friendshipLevel,
  setFriendshipLevel,
  prefLucky,
  setPrefLucky,
}) => {
  const handleFriendshipChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextFriendshipLevel = Number.parseInt(event.target.value, 10);
    setFriendshipLevel(nextFriendshipLevel);

    if (nextFriendshipLevel < MAX_FRIENDSHIP_LEVEL) {
      setPrefLucky(false);
    }
  };

  const toggleLucky = () => {
    if (!prefLucky) {
      setFriendshipLevel(MAX_FRIENDSHIP_LEVEL);
    }
    setPrefLucky((prev) => !prev);
  };

  return (
    <div className="friendship-search-options">
      <div className="hearts-lucky-container">
        <div className="hearts">
          {Array.from({ length: MAX_FRIENDSHIP_LEVEL }).map((_, index) => {
            const isFilled = index < friendshipLevel;
            return (
              <img
                key={`heart-${index}`}
                src={`/images/${isFilled ? 'heart-filled' : 'heart-unfilled'}.png`}
                alt={`Friendship Level ${isFilled ? 'Filled' : 'Unfilled'}`}
                className="heart"
              />
            );
          })}
        </div>
        <img
          src="/images/lucky_friend_icon.png"
          alt="Lucky Friend"
          className={`lucky-icon ${prefLucky ? '' : 'grey-out'}`}
          onClick={toggleLucky}
          style={{
            cursor:
              friendshipLevel === MAX_FRIENDSHIP_LEVEL || !prefLucky
                ? 'pointer'
                : 'default',
          }}
        />
      </div>
      <input
        type="range"
        min="0"
        max={MAX_FRIENDSHIP_LEVEL}
        value={friendshipLevel}
        onChange={handleFriendshipChange}
        className="friendship-slider"
      />
    </div>
  );
};

export default FriendshipSearch;
