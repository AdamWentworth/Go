// RegisterSocialButtons.tsx
import React from 'react';
import {
  GoogleLoginButton,
  FacebookLoginButton,
  TwitterLoginButton,
  DiscordLoginButton,
} from 'react-social-login-buttons';
import { useModal } from '@/contexts/ModalContext';

const RegisterSocialButtons = () => {
  const { alert } = useModal();

  const showComingSoon = (providerName: string) => {
    void alert(`${providerName} login is not yet implemented.`);
  };

  return (
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
};

export default RegisterSocialButtons;
