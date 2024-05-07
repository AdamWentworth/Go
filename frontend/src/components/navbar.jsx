import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';
import MainButtons from './MainButtons'; // Make sure to import MainButtons

function Navbar() {
    const location = useLocation(); // Hook to get the current location
    const logoUrl = process.env.PUBLIC_URL + '/images/logo/logo.png';

    const showMainButtons = location.pathname !== '/';

    return (
        <div className="navbar">
            <div className="logo-container">
                <img src={logoUrl} alt="Logo" />
            </div>
            <div className="title-container">
                <h1>Welcome to Pokémon Go Nexus</h1>
            </div>
            {showMainButtons && <MainButtons navbar={true} />}
            <div className="navbar-buttons">
                <Link to="/login"><button>Login</button></Link>
                <Link to="/register"><button>Register</button></Link>
                <button>Language</button>
            </div>
        </div>
    );
}

export default Navbar;
