// AuthButtons.tsx

import React from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import './AuthButtons.css';

const AuthButtons: React.FC = () => {
  const { isLoggedIn } = useAuth() ?? {};

  return (
    <div className="auth-buttons">
      {isLoggedIn ? (
        <Link to="/profile" className="auth-link">
          <span className="auth-button">Profile</span>
        </Link>
      ) : (
        <>
          <Link to="/login" className="auth-link">
            <span className="auth-button">Login</span>
          </Link>
          <Link to="/register" className="auth-link">
            <span className="auth-button">Register</span>
          </Link>
        </>
      )}
    </div>
  );
};

export default AuthButtons;
