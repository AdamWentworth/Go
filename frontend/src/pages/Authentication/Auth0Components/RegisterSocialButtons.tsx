// RegisterSocialButtons.tsx
import React from 'react';
import { toast } from 'react-toastify';
import {
  GoogleLoginButton,
  FacebookLoginButton,
  TwitterLoginButton,
  DiscordLoginButton,
} from 'react-social-login-buttons';

const showComingSoon = (providerName: string) => {
  toast.info(`${providerName} login is not yet implemented.`);
};

const RegisterSocialButtons = () => (
  <div className="form-social">
    <GoogleLoginButton onClick={() => showComingSoon('Google')}>
      Register with Google
    </GoogleLoginButton>
    <FacebookLoginButton onClick={() => showComingSoon('Facebook')}>
      Register with Facebook
    </FacebookLoginButton>
    <TwitterLoginButton onClick={() => showComingSoon('Twitter')}>
      Register with Twitter
    </TwitterLoginButton>
    <DiscordLoginButton onClick={() => showComingSoon('Discord')}>
      Register with Discord
    </DiscordLoginButton>
  </div>
);

export default RegisterSocialButtons;
