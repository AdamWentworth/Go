// FriendshipManager.jsx

import React from 'react';

const FriendshipManager = ({ friendship, setFriendship, editMode }) => {
    const handleFriendshipChange = (e) => {
        const newFriendshipLevel = parseInt(e.target.value, 10);
        setFriendship(newFriendshipLevel);
    };

    const hearts = [];
    for (let i = 0; i < 4; i++) {
        hearts.push(
            <img 
                key={`heart-${i}`}
                src={`${process.env.PUBLIC_URL}/images/${i < friendship ? 'heart-filled' : 'heart-unfilled'}.png`}
                alt={`Friendship Level ${i < friendship ? 'Filled' : 'Unfilled'}`}
                className="heart"
            />
        );
    }

    return (
        <div className="friendship-level-container">
            <div className="hearts">
                {hearts}
            </div>
            {editMode && (
                <input
                    type="range"
                    min="0"
                    max="4"
                    value={friendship}
                    onChange={handleFriendshipChange}
                    className="friendship-slider"
                />
            )}
        </div>
    );
};

export default FriendshipManager;
