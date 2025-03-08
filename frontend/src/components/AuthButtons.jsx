// AuthButtons.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthButtons.css';

const AuthButtons = () => {
  const { isLoggedIn } = useAuth();

  return (
    <div className="auth-buttons">
      {isLoggedIn ? (
        <Link to="/account" className="auth-link">
          <button className="auth-button">Account</button>
        </Link>
      ) : (
        <>
          <Link to="/login" className="auth-link">
            <button className="auth-button">Login</button>
          </Link>
          <Link to="/register" className="auth-link">
            <button className="auth-button">Register</button>
          </Link>
        </>
      )}
    </div>
  );
};

export default AuthButtons;
