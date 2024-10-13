// FriendshipManager.jsx

import React from 'react';
import './FriendshipManager.css';

const FriendshipManager = ({ friendship, setFriendship, editMode, isLucky, setIsLucky }) => {
    const handleFriendshipChange = (e) => {
        const newFriendshipLevel = parseInt(e.target.value, 10);
        if (isLucky && newFriendshipLevel !== 4) {
            setIsLucky(false); // Turn off lucky if friendship level is not 4
        }
        setFriendship(newFriendshipLevel);
    };

    const toggleLucky = () => {
        if (editMode) {
            const newLuckyStatus = !isLucky;
            setIsLucky(newLuckyStatus);
            if (newLuckyStatus) {
                setFriendship(4); // Automatically set to max friendship if lucky is toggled on
            }
        }
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
            <div className="hearts-lucky-container">
                <div className="hearts">
                    {hearts}
                </div>
                <img 
                    src={`${process.env.PUBLIC_URL}/images/lucky_friend_icon.png`} 
                    alt="Lucky Friend" 
                    className={`lucky-icon ${isLucky ? '' : 'grey-out'}`}
                    onClick={toggleLucky}
                    style={{ cursor: editMode ? 'pointer' : 'default' }}
                />
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