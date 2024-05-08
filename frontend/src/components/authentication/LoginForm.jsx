// LoginForm.jsx

import React from 'react';
import { GoogleLoginButton, FacebookLoginButton, TwitterLoginButton } from 'react-social-login-buttons';

const LoginForm = ({
  values,
  errors,
  onChange,
  onSubmit
}) => {
  return (
    <div className="login-page">
      <div className="login-form">
        <form onSubmit={onSubmit}>
          <input type="text" name="username" value={values.username} onChange={onChange} placeholder="Username or Email" required />
          <input type="password" name="password" value={values.password} onChange={onChange} placeholder="Password" required />
          {errors.password && <div style={{ color: 'red' }}>{errors.password}</div>}
          <button type="submit">Login</button>
          <div className="social-login-buttons">
            <GoogleLoginButton onClick={() => console.log("Google login")}>
                Login with Google
            </GoogleLoginButton>
            <FacebookLoginButton onClick={() => console.log("Facebook login")}>Login with Facebook</FacebookLoginButton>
            <TwitterLoginButton onClick={() => console.log("Twitter login")}>Login with Twitter</TwitterLoginButton>
            {/* Discord login button */}
            <button className="discord-button" onClick={() => console.log("Discord login")}>
              <img src="images/discord_icon.png" alt="Discord" />
              Login with Discord
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
