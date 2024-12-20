// src/components/FormComponents/LoginForm.jsx

import React from 'react';
import {
  GoogleLoginButton,
  FacebookLoginButton,
  TwitterLoginButton,
  DiscordLoginButton,
} from 'react-social-login-buttons';
import './LoginForm.css';

const LoginForm = ({
  values,
  errors,
  onChange,
  onSubmit,
  onResetPassword, // Added prop for handling reset password
}) => {
  return (
    <div className="login-page">
      <div className="login-form">
        <form onSubmit={onSubmit}>
          <input
            type="text"
            name="username"
            value={values.username}
            onChange={onChange}
            placeholder="Username or Email"
            required
          />
          <input
            type="password"
            name="password"
            value={values.password}
            onChange={onChange}
            placeholder="Password"
            required
          />
          {errors.password && <div className="error-message">{errors.password}</div>}
          {errors.username && <div className="error-message">{errors.username}</div>}
          <button type="submit">Login</button>
          <button
            type="button"
            className="reset-password-button"
            onClick={() => alert('Password Reset is not yet implemented.')} // Hook up the reset password handler
          >
            Reset Password
          </button>
          <div className="social-login-buttons">
            <GoogleLoginButton onClick={() => alert('Google login is not yet implemented.')}>
              Login with Google
            </GoogleLoginButton>
            <FacebookLoginButton onClick={() => alert('Facebook login is not yet implemented.')}>
              Login with Facebook
            </FacebookLoginButton>
            <TwitterLoginButton onClick={() => alert('Twitter login is not yet implemented.')}>
              Login with Twitter
            </TwitterLoginButton>
            <DiscordLoginButton onClick={() => alert('Discord login is not yet implemented.')}>
              Login with Discord
            </DiscordLoginButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
