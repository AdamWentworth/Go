// RegisterSocialButtons.jsx
import React from 'react';
import {
  GoogleLoginButton,
  FacebookLoginButton,
  TwitterLoginButton,
  DiscordLoginButton,
} from 'react-social-login-buttons';

const RegisterSocialButtons = () => (
  <div className="form-social">
    <GoogleLoginButton onClick={() => alert('Google login is not yet implemented.')}>
      Register with Google
    </GoogleLoginButton>
    <FacebookLoginButton onClick={() => alert('Facebook login is not yet implemented.')}>
      Register with Facebook
    </FacebookLoginButton>
    <TwitterLoginButton onClick={() => alert('Twitter login is not yet implemented.')}>
      Register with Twitter
    </TwitterLoginButton>
    <DiscordLoginButton onClick={() => alert('Discord login is not yet implemented.')}>
      Register with Discord
    </DiscordLoginButton>
  </div>
);

export default RegisterSocialButtons;
