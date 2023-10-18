import React from 'react';
import { Link } from 'react-router-dom';
import './mainButtons.css';

function MainButtons() {
    return (
        <div className="mainButtonsContainer">
            <Link to="/pokemon">
                <button className="mainButton collect-btn">Collect</button>
            </Link>
            <button className="mainButton pvp-btn">PVP</button>
            <button className="mainButton raid-btn">Raid</button>
        </div>
    );
}

export default MainButtons;
