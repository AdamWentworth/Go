// MainButtons.js

import React from 'react';
import { Link } from 'react-router-dom';
import './MainButtons.css';

function MainButtons({ navbar }) {
    const containerClass = navbar ? "mainButtonsContainerNavbar" : "mainButtonsContainer";

    return (
        <div className={containerClass}>
            {/* <button className="mainButton pvp-btn">PVP</button> */}
            <Link to="/pokemon">
                <button className="mainButton collect-btn">Pokemon</button>
            </Link>
            {/* <Link to="/raid">
                <button className="mainButton raid-btn">Raid</button>
            </Link> */}
            <Link to="/search"> 
                <button className="mainButton discover-btn">Search</button>
            </Link>
                {/* <button className="mainButton leaderboards-btn">Leaderboards</button> */}
        </div>
    );
}

export default MainButtons;
