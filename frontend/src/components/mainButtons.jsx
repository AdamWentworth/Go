import React from 'react';
import { Link } from 'react-router-dom';
import './MainButtons.css';

function MainButtons({ navbar }) { // Added a prop `navbar` to determine the context
    // Conditional class name based on the navbar prop
    const containerClass = navbar ? "mainButtonsContainerNavbar" : "mainButtonsContainer";

    return (
        <div className={containerClass}>
            <button className="mainButton pvp-btn">PVP</button>
            <Link to="/pokemon">
                <button className="mainButton collect-btn">Collect</button>
            </Link>
            <button className="mainButton raid-btn">Raid</button>
        </div>
    );
}

export default MainButtons;
