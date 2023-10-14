import React from 'react';
import './navbar.css';

function Navbar() {
    return (
        <div className="navbar">
            <div className="title-container">
                <h1>Welcome to Pokemon Go Nexus</h1>
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
