import React from 'react';
import './navbar.css';

function Navbar() {
    const logoUrl = process.env.PUBLIC_URL + '/images/logo/logo.jpg'; // Construct the URL

    return (
        <div className="navbar">
            <div className="logo-container">
                <img src={logoUrl} alt="Logo" /> {/* Use the URL instead of importing */}
            </div>
            <div className="title-container">
                <h1>Welcome to Pokémon Go Nexus</h1>
            </div>
            <div className="navbar-buttons">
                <button>Login</button>
                <button>Sign Up</button>
                <button>Language</button>
            </div>
        </div>
    );
};

export default Navbar;
