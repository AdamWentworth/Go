// FriendshipLevel.tsx

import React from 'react';
import './FriendshipLevel.css';

type FriendshipLevelProps = {
  level: number;
  prefLucky: boolean;
};

const FriendshipLevel: React.FC<FriendshipLevelProps> = ({ level, prefLucky }) => {
  const hearts = [];

  for (let i = 0; i < 4; i++) {
    hearts.push(
      <img
        key={`heart-${i}`}
        src={`/images/${i < level ? 'heart-filled' : 'heart-unfilled'}.png`}
        alt={`Friendship Level ${i < level ? 'Filled' : 'Unfilled'}`}
        className="heart"
      />
    );
  }

  return (
    <div className="hearts-lucky-container">
      <div className="hearts">{hearts}</div>
      <img
        src="/images/lucky_friend_icon.png"
        alt="Lucky Friend"
        className={`lucky-icon ${prefLucky ? '' : 'grey-out'}`}
      />
    </div>
  );
};

export default FriendshipLevel;
